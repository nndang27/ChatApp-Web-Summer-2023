//index.js
// const {VideoPlayer,addVideoToElement} = require('./localScreen.js') 
const io = require('socket.io-client')
const mediasoupClient = require('mediasoup-client')

const roomName = window.location.pathname.split('/')[2]
const host_name = window.location.pathname.split('/')[3]

const socket = io("/mediasoup")
module.exports = socket
socket.on('connection-success', ({ socketId }) => {
  console.log(socketId)
  getLocalStream()
})

let isShareScreen;
let listOfVideoFrame = {}
listOfVideoFrame["localVideo"] = "localColumn"

let device
let rtpCapabilities
let producerTransport
let consumerTransports = []
let audioProducer
let videoProducer
let screenVideoProducer
let screenAudioProducer
let consumer

let isProducer = false
let isturnOnShareScreen = false
let isturnOffCamera = false
let isturnOffMic = false

// https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerOptions
// https://mediasoup.org/documentation/v3/mediasoup-client/api/#transport-produce
let params = {
  // mediasoup params
  encodings: [
    {
      rid: 'r0',
      maxBitrate: 100000,
      scalabilityMode: 'S1T3',
    },
    {
      rid: 'r1',
      maxBitrate: 300000,
      scalabilityMode: 'S1T3',
    },
    {
      rid: 'r2',
      maxBitrate: 900000,
      scalabilityMode: 'S1T3',
    },
  ],
  // https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerCodecOptions
  codecOptions: {
    videoGoogleStartBitrate: 1000
  },
  
}

let audioParams;
let videoParams = { params };
let consumingTransports = [];
// let localVideo
const streamSuccess = (stream) => {
  // localVideo = VideoPlayer("localVideo")
  // addVideoToElement('localColumn', 'localVideo')
  // localVideo = document.querySelector('#localVideo')
  // console.log("hello",localVideo)
  localVideo.srcObject = stream
  isShareScreen = false
  audioParams = { track: stream.getAudioTracks()[0] , appData: {isShareScreen: isShareScreen}};
  videoParams = { track: stream.getVideoTracks()[0], ...videoParams, appData: {isShareScreen: isShareScreen} };
  console.log('Video track:', stream.getVideoTracks()[0])

  joinRoom()
}

const joinRoom = () => {
  socket.emit('joinRoom', { roomName, host_name }, (data) => {
    console.log(`Router RTP Capabilities... ${data.rtpCapabilities}`)
    // we assign to local variable and will be used when
    // loading the client Device (see createDevice above)
    rtpCapabilities = data.rtpCapabilities

    // once we have rtpCapabilities from the Router, create Device
    createDevice()
  })
}

const getLocalStream = () => {
  navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  })
    .then(streamSuccess)
    .catch(error => {
      console.log(error.message)
    })
}

// A device is an endpoint connecting to a Router on the
// server side to send/recive media
const createDevice = async () => {
  try {
    device = new mediasoupClient.Device()

    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#device-load
    // Loads the device with RTP capabilities of the Router (server side)
    await device.load({
      // see getRtpCapabilities() below
      routerRtpCapabilities: rtpCapabilities
    })
    console.log('Device RTP Capabilities', device.rtpCapabilities)

    // once the device loads, create transport
    createSendTransport()

  } catch (error) {
    console.log(error)
    if (error.name === 'UnsupportedError')
      console.warn('browser not supported')
  }
}

const createSendTransport = () => {
  // see server's socket.on('createWebRtcTransport', sender?, ...)
  // this is a call from Producer, so sender = true
  socket.emit('createWebRtcTransport', { consumer: false }, ({ params }) => {
    // The server sends back params needed 
    // to create Send Transport on the client side
    if (params.error) {
      console.log(params.error)
      return
    }

    console.log(`Paramm ${params}`)

    // creates a new WebRTC Transport to send media
    // based on the server's producer transport params
    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#TransportOptions
    producerTransport = device.createSendTransport(params)

    // https://mediasoup.org/documentation/v3/communication-between-client-and-server/#producing-media
    // this event is raised when a first call to transport.produce() is made
    // see connectSendTransport() below
    producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        // Signal local DTLS parameters to the server side transport
        // see server's socket.on('transport-connect', ...)
        await socket.emit('transport-connect', {
          dtlsParameters,
        })

        // Tell the transport that parameters were transmitted.
        callback()

      } catch (error) {
        errback(error)
      }
    })

    producerTransport.on('produce', async (parameters, callback, errback) => {

      try {
        // tell the server to create a Producer
        // with the following parameters and produce
        // and expect back a server side producer id
        // see server's socket.on('transport-produce', ...)
        await socket.emit('transport-produce', {
          kind: parameters.kind,
          rtpParameters: parameters.rtpParameters,
          appData: parameters.appData,
        }, ({ id, producersExist }) => {
          // Tell the transport that parameters were transmitted and provide it with the
          // server side producer's id.
          callback({ id })

          // if producers exist, then join room
          if (producersExist) getProducers()
        })
      } catch (error) {
        errback(error)
      }
    })

    connectSendTransport()
  })
}


const connectSendTransport = async () => {
  // we now call produce() to instruct the producer transport
  // to send media to the Router
  // https://mediasoup.org/documentation/v3/mediasoup-client/api/#transport-produce
  // this action will trigger the 'connect' and 'produce' events above
  isShareScreen = false
  audioProducer = await producerTransport.produce(audioParams);
  videoProducer = await producerTransport.produce(videoParams);

  audioProducer.on('trackended', () => {
    console.log('audio track ended')

  })

  audioProducer.on('transportclose', () => {
    console.log('audio transport ended')

  })

  videoProducer.on('trackended', () => {
    console.log('video track ended')

  })

  videoProducer.on('transportclose', () => {
    console.log('video transport ended')

  })
}
// ___________________________________________________________________________________________________________________________________________
// _______________________________________________________CONSUMER____________________________________________________________________________
// ___________________________________________________________________________________________________________________________________________

const signalNewConsumerTransport = async (remoteProducerId) => {
  //check if we are already consuming the remoteProducerId
  if (consumingTransports.includes(remoteProducerId)) return;
  consumingTransports.push(remoteProducerId);

  await socket.emit('createWebRtcTransport', { consumer: true }, ({ params }) => {
    // The server sends back params needed 
    // to create Send Transport on the client side
    if (params.error) {
      console.log(params.error)
      return
    }
    console.log(`PARAMS... ${params}`)

    let consumerTransport
    try {
      consumerTransport = device.createRecvTransport(params)
    } catch (error) {
      // exceptions: 
      // {InvalidStateError} if not loaded
      // {TypeError} if wrong arguments.
      console.log(error)
      return
    }

    consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        // Signal local DTLS parameters to the server side transport
        // see server's socket.on('transport-recv-connect', ...)
        await socket.emit('transport-recv-connect', {
          dtlsParameters,
          serverConsumerTransportId: params.id,
        })

        // Tell the transport that parameters were transmitted.
        callback()
      } catch (error) {
        // Tell the transport that something was wrong
        errback(error)
      }
    })

    connectRecvTransport(consumerTransport, remoteProducerId, params.id)
  })
}
// ________________________________________________________________________________________________________________________
let host_list2;
// server informs the client of a new producer just joined
socket.on('new-producer', ({ producerId, host_list }) => {
  // console.log("HOST LIST: ",host_list)
  host_list2 = host_list
  
  signalNewConsumerTransport(producerId)
})
// _______________________________________________________________________________________________________________________

const getProducers = () => {
  socket.emit('getProducers', (producerIds, host_list) => {
    // console.log("HOST LIST: ",host_list)
    host_list2 = host_list;
    // for each of the producer create a consumer
    // producerIds.forEach(id => signalNewConsumerTransport(id))
    producerIds.forEach(signalNewConsumerTransport)
  })
}

// ______________________________________________________________________________________________________________________
let socketIDlist = []
let check = 1
const connectRecvTransport = async (consumerTransport, remoteProducerId, serverConsumerTransportId) => {
  // for consumer, we need to tell the server first
  // to create a consumer based on the rtpCapabilities and consume
  // if the router can consume, it will send back a set of params as below
  
  await socket.emit('consume', {
    rtpCapabilities: device.rtpCapabilities,
    remoteProducerId,
    serverConsumerTransportId,
  }, async ({ params }) => {
    if (params.error) {
      console.log('Cannot Consume')
      return
    }

    console.log('Consumer Params' ,params)
    
    // then consume with the local consumer transport
    // which creates a consumer
    const consumer = await consumerTransport.consume({
      id: params.id,
      producerId: params.producerId,
      kind: params.kind,
      rtpParameters: params.rtpParameters,
    })

    consumerTransports = [
      ...consumerTransports,
      { socketID: params.consumer_socketID,
        consumerTransport,
        serverConsumerTransportId: params.id,
        producerId: remoteProducerId,
        consumer,
        isShareScreen: params.consumer_isShareScreen==true? 'screen': 'cam'
      },
    ]
    // console.log("consumerTransports::", consumerTransports)

    // create a new div element for the new consumer media
    console.log("find_ele: ",params.consumer_socketID)
    let newElem = document.getElementById(`td-${params.consumer_socketID}`)
    if(!newElem){
      newElem = document.createElement('div')
      newElem.setAttribute('id', `td-${params.consumer_socketID}`)
      // newElem.style.border= '2px solid green';
      // newElem.style.display = 'inline-block'
      videoContainer.appendChild(newElem)
      
    }
    

    if (params.kind == 'audio') {
      //append to the audio container
      // newElem.innerHTML = '<audio id="' + remoteProducerId + '" autoplay></audio>'
      const audio = document.createElement('audio')
      audio.setAttribute('id', `${remoteProducerId}`)
      audio.setAttribute('autoplay', '')
      newElem.appendChild(audio)
    } else {
      //append to the video container
      // newElem.setAttribute('class', 'remoteVideo')
      // newElem.innerHTML = '<video id="' + remoteProducerId + '" autoplay class="video" ></video>'
      const video = document.createElement('video')
      video.setAttribute('id', `${remoteProducerId}`)
      video.setAttribute('autoplay', '')
      video.setAttribute('class', 'video')
      newElem.appendChild(video)
      listOfVideoFrame[`${remoteProducerId}`] = `td-${params.consumer_socketID}`
      video.addEventListener('click', expandVideoFrame)
    }

    

    // destructure and retrieve the video track from the producer
    const { track } = consumer
    console.log("Consumer track:", [track])
    document.getElementById(remoteProducerId).srcObject = new MediaStream([track])

    // the server consumer started with media paused
    // so we need to inform the server to resume
    socket.emit('consumer-resume', { serverConsumerId: params.serverConsumerId })

    // ------------------Participant Area Added--------------------------------------------------------------------------------------------
    var participant_Column = document.querySelector('.participantsColumn');
    //Add socketID (if socketID already existed, not add)
    const host_namee = decodeURI(host_list2[params.consumer_socketID])
    if (!socketIDlist.includes(params.consumer_socketID)) {
      socketIDlist.push(params.consumer_socketID);
      var participant_div = `<div id="par-${params.consumer_socketID}">
                              <p style="color: green;"> ${host_namee} </p>
                              <div id="cam-${params.consumer_socketID}" >
                                  <h6 style="display: inline-block;"> Cam: </h6>
                                  <div id="cam-video-${params.consumer_socketID}" name="on" class="button2" style="display: inline-block;width: 20px;">
                                    <img src="./icons/cam.png" style="width: 20px;"/>
                                  </div>
                                  <div id="cam-audio-${params.consumer_socketID}" name="on" class="button2" style="display: inline-block;width: 20px;">
                                    <img src="./icons/micro.png" style="width: 20px;"/>
                                  </div>
                                
                              </div>
                              <div id="screen-${params.consumer_socketID}">
                                <h6 style="display: inline-block;"> Sreen shared: </h6>
                                  <div id="screen-video-${params.consumer_socketID}" name="on" class="button2" style="display: inline-block;width: 20px;">
                                    <img src="./icons/share.png" style="width: 20px;"/>
                                  </div>
                                  <div id="screen-audio-${params.consumer_socketID}" name="on" class="button2" style="display: inline-block;width: 20px;">
                                    <img src="./icons/loud.png" style="width: 20px;"/>
                                  </div>
                              </div>
                            </div>`
      participant_Column.insertAdjacentHTML("beforeend", participant_div)
    }
    
    if(params.consumer_isShareScreen==false){
      // -------------------------Turn the Camera consumer--------------
      if(params.kind=='video'){
        let cam_video_btn = document.getElementById(`cam-video-${params.consumer_socketID}`)
        cam_video_btn.classList.toggle('button2');
        cam_video_btn.addEventListener('click', function(){
          //if consumer is closed, button is freeze
          if(consumerTransports.find(transportData => transportData.producerId === remoteProducerId)===undefined){return}

          var nameValue = cam_video_btn.getAttribute("name");
          if(nameValue=="on"){
            console.log("cam-off")
            consumer.pause()
            cam_video_btn.setAttribute('name', "off")
            cam_video_btn.classList.toggle('button2');
          }
          if(nameValue=="off"){
            console.log("cam-on")
            consumer.resume()
            cam_video_btn.setAttribute('name', "on")
            cam_video_btn.classList.toggle('button2');
          }
        })
      }
      // -------------------------Turn the mic consumer--------------
      if(params.kind=='audio'){
        let cam_audio_btn = document.getElementById(`cam-audio-${params.consumer_socketID}`)
        cam_audio_btn.classList.toggle('button2');
        cam_audio_btn.addEventListener('click', function(){
          //if consumer is closed, button is freeze
          if(consumerTransports.find(transportData => transportData.producerId === remoteProducerId)===undefined){return}

          var nameValue = cam_audio_btn.getAttribute("name");
          if(nameValue=="on"){
            console.log("mic-off")
            consumer.pause()
            cam_audio_btn.setAttribute('name', "off")
            cam_audio_btn.classList.toggle('button2');
          }
          if(nameValue=="off"){
            console.log("mic-on")
            consumer.resume()
            cam_audio_btn.setAttribute('name', "on")
            cam_audio_btn.classList.toggle('button2');
          }
        })
      }
    }
    // ----------------if isShareScreen of cosumer is True--------------------
    if(params.consumer_isShareScreen==true){
      // -------------------------Turn the screen Camera consumer--------------
      if(params.kind=='video'){
        let screen_video_btn = document.getElementById(`screen-video-${params.consumer_socketID}`)
        screen_video_btn.classList.toggle('button2');
        screen_video_btn.addEventListener('click', function(){
          //if consumer is closed, button is freeze
          console.log(3)
          if(consumerTransports.find(transportData => transportData.producerId === remoteProducerId)===undefined){return}
          console.log(4)
          var nameValue = screen_video_btn.getAttribute("name");
          if(nameValue=="on"){
            console.log("screen-cam-off")
            consumer.pause()
            screen_video_btn.setAttribute('name', "off")
            screen_video_btn.classList.toggle('button2');
          }
          if(nameValue=="off"){
            console.log("screen-cam-on")
            consumer.resume()
            screen_video_btn.setAttribute('name', "on")
            screen_video_btn.classList.toggle('button2');
          }
        })
      }
      // -------------------------Turn the mic consumer--------------
      if(params.kind=='audio'){
        let screen_audio_btn = document.getElementById(`screen-audio-${params.consumer_socketID}`)
        screen_audio_btn.classList.toggle('button2');
        screen_audio_btn.addEventListener('click', function(){
          //if consumer is closed, button is freeze
          if(consumerTransports.find(transportData => transportData.producerId === remoteProducerId)===undefined){return}

          var nameValue = screen_audio_btn.getAttribute("name");
          if(nameValue=="on"){
            console.log("screen-mic-off")
            consumer.pause()
            screen_audio_btn.setAttribute('name', "off")
            screen_audio_btn.classList.toggle('button2');
          }
          if(nameValue=="off"){
            console.log("screen-mic-on")
            consumer.resume()
            screen_audio_btn.setAttribute('name', "on")
            screen_audio_btn.classList.toggle('button2');
          }
        })
      }
    }
    
    
    // ------------------------------End-------------------------------

  })
}

// ___________________________________________________________________________________________________________________________________________________________

socket.on('producer-closed', ({ remoteProducerId }) => {
  // server notification is received when a producer is closed
  // we need to close the client-side consumer and associated transport
  console.log("procedudd",remoteProducerId)
  const producerToClose = consumerTransports.find(transportData => transportData.producerId === remoteProducerId)
  if(producerToClose==null){
    return
  }
  
  let consumer_socketid = producerToClose.socketID
  
  producerToClose.consumerTransport.close()
  producerToClose.consumer.close()

  // remove the consumer transport from the list
  consumerTransports = consumerTransports.filter(transportData => transportData.producerId !== remoteProducerId)

  const find_ele = document.getElementById(`td-${consumer_socketid}`)
  // remove the video div element
  let displayFrame = document.querySelector('.largeScreen')
  let child = displayFrame.children[0]
  // console.log("alooo: ",child.id, remoteProducerId)
  if(child){
    if(child.id == remoteProducerId){
      displayFrame.removeChild(child)
    }
    else{
      find_ele.removeChild(document.getElementById(`${remoteProducerId}`))
    }
  }
  else{
    find_ele.removeChild(document.getElementById(`${remoteProducerId}`))
  }
  
  
  
  
  //COunt how many number of consumer come from a socketID is existing(if it ==0, close a participant div)
  let num_consumer_of_socketID = consumerTransports.filter(transportData => transportData.socketID === consumer_socketid).length
  if(num_consumer_of_socketID==0){
    var participant_Column = document.querySelector('.participantsColumn');
    participant_Column.removeChild(document.getElementById(`par-${consumer_socketid}`))
  }
  else{
    let button_deleted = document.getElementById(`${producerToClose.isShareScreen}-${producerToClose.consumer.kind}-${consumer_socketid}`)
    button_deleted.classList.toggle('button2');
    check = 2
  }

})


// _________________________________________________________________Turn on Share Screen ___________________________________________________________________

let stream2
let isturnOffCameraShareScreen = false
let isturnOffMicShareScreen = false
let id_shareScreen=null

const getShareScreenPausedState = () => {
  // clicked_sharescreen
  let btnLocalScreen = document.getElementById('btnLocalScreen')
  if (isturnOnShareScreen == false) {
    isturnOnShareScreen = true
    // btnLocalScreen.classList.toggle('button-clicked_sharescreen');
    btnLocalScreen.style.backgroundColor = 'rgb(98, 255, 80)'
    console.log("screen on")
    // ------------Add HTML localShareScreen------------
    var tdElement = document.querySelector('.ShareScreen');

    const newEle = document.createElement('video')
    newEle.setAttribute('id', "localShareScreen")
    newEle.setAttribute('class', "video")
    newEle.setAttribute('autoplay', '')

    // const btnCamShareScreen = document.createElement('button')
    // btnCamShareScreen.setAttribute('id', "btnCamShareScreen")
    // btnCamShareScreen.innerHTML = 'Camera'
    const btnCamShareScreen2 = `<div id="btnCamShareScreen" class="button-clicked_camera_share_screen2">
                                  <img src="./icons/share.png" style="width: 30px;"/>
                                </div>`
    // participant_Column.insertAdjacentHTML("beforeend", btnCamShareScreen)
    // const btnMicShareScreen = document.createElement('button')
    // btnMicShareScreen.setAttribute('id', "btnMicShareScreen")
    // btnMicShareScreen.innerHTML = 'Mic'

    const btnMicShareScreen2 = `<div id="btnMicShareScreen" class="button-clicked_mic_share_screen2">
                                  <img src="./icons/loud.png" style="width: 30px;"/>
                                </div>`

    if (tdElement) {
      tdElement.appendChild(newEle);
      // tdElement.appendChild(btnCamShareScreen);
      tdElement.insertAdjacentHTML("beforeend", btnCamShareScreen2)
      tdElement.insertAdjacentHTML("beforeend", btnMicShareScreen2)
      // tdElement.appendChild(btnMicShareScreen);
      // btnCamShareScreen.style.position = 'absolute'
      // btnCamShareScreen.style.top = 0
      // btnMicShareScreen.style.position = 'absolute'
      // btnMicShareScreen.style.top = 0
      // newEle.style.width = 200
    }
    isButtonCreated = true
    // -------------Send the media by exist producer------------------
    const btnCamShareScreen = document.getElementById("btnCamShareScreen")
    const btnMicShareScreen = document.getElementById("btnMicShareScreen")
    connectSendTransport2()
    btnCamShareScreen.addEventListener('click', getCamShareScreenPausedState)
    btnMicShareScreen.addEventListener('click', getMicShareScreenPausedState)
    return
  }

  // _____________TURN OFF SHARE SCREEN__________
  if (isturnOnShareScreen == true) {
    isturnOnShareScreen = false
    console.log("screen off")
    // btnLocalScreen.classList.toggle('button-clicked_sharescreen');
    btnLocalScreen.style.backgroundColor = 'rgba(148, 148, 148, 0.9)'

    id_shareScreen = screenVideoProducer.id
    socket.emit('producerClose', { id_shareScreen });
    screenVideoProducer.close()
    if (screenAudioProducer) {
      screenAudioProducer.close()
    }
    stream2 = null
    screenVideoProducer = null
    screenAudioProducer = null
    

    var shareScreenContainer = document.querySelector('.ShareScreen');
    let displayFrame = document.querySelector('.largeScreen')
    let child = displayFrame.children[0]
    // console.log("alooo: ",child.id)
    if(child){
      if(child.id == 'localShareScreen'){
        displayFrame.removeChild(child)
        shareScreenContainer.removeChild(document.getElementById('btnCamShareScreen'))
        shareScreenContainer.removeChild(document.getElementById('btnMicShareScreen'))
      }
      else{
        shareScreenContainer.removeChild(document.getElementById('localShareScreen'))
        shareScreenContainer.removeChild(document.getElementById('btnCamShareScreen'))
        shareScreenContainer.removeChild(document.getElementById('btnMicShareScreen'))
      }
    }
    else{
      shareScreenContainer.removeChild(document.getElementById('localShareScreen'))
      shareScreenContainer.removeChild(document.getElementById('btnCamShareScreen'))
      shareScreenContainer.removeChild(document.getElementById('btnMicShareScreen'))
    }
    
    

    return
  }
}



const connectSendTransport2 = async () => {
  stream2 = null;
  stream2 = await navigator.mediaDevices.getDisplayMedia({
    video:{
      displaySurface : 'monitor',
      logicalSurface : true,
      cursor         : true,
      width          : { max: 1920 },
      height         : { max: 1080 },
      frameRate      : { max: 30 }
    },
    audio: true
  })
  
  let localShareScreen = document.getElementById("localShareScreen");
  let newStream = new MediaStream();
  stream2.getTracks().forEach(track => newStream.addTrack(track));
  localShareScreen.srcObject = newStream;
  console.log("check THe trackk: ",stream2.getVideoTracks()[0])
  listOfVideoFrame["localShareScreen"]= "ShareScreen"
  localShareScreen.addEventListener('click', expandVideoFrame)

  let audioScreenparams
  let videoScreenparams = { params }; //Phai khai bao vide param o day neu khong se bi loi.
  isShareScreen=true
  audioScreenparams = {track: stream2.getAudioTracks()[0] ,appData: {isShareScreen: isShareScreen}};
  videoScreenparams = {track: stream2.getVideoTracks()[0], ...videoScreenparams, appData: {isShareScreen: isShareScreen} };

  isShareScreen = true
  console.log("track is opened?:", stream2.getVideoTracks()[0].readyState)
  screenVideoProducer = await producerTransport.produce(videoScreenparams);
  screenVideoProducer.track.onended = async () => {
    console.log("DONg track cmnr")
  }
  //---------------Neu may tinh co audio(CHi co tren Window moi co audio cho share screen neu khong thi ta share tab cung se co audio)
  if (stream2.getAudioTracks().length) {
    screenAudioProducer = await producerTransport.produce(audioScreenparams);


    screenAudioProducer.on('trackended', () => {
      console.log('audio track ended')
      // close audio track
    })

    screenAudioProducer.on('transportclose', () => {
      console.log('audio transport ended')

      // close audio track
    })
  }

  screenVideoProducer.on('trackended', () => {
    console.log('video track ended')
    getShareScreenPausedState()

    // close video track
  })

  screenVideoProducer.on('transportclose', () => {
    console.log('video transport ended')

    // close video track
  })

  

}
// -----------------Turn off Cam Share Screen---------------

const getCamShareScreenPausedState = () => {

  let btnLocalVideo = document.getElementById('btnCamShareScreen');
  if (isturnOffCameraShareScreen == false) {
    isturnOffCameraShareScreen = true
    // btnLocalVideo.classList.toggle('button-clicked_camera_share_screen');
    if (btnLocalVideo.classList.contains("button-clicked_camera_share_screen2")) {
      btnLocalVideo.classList.remove("button-clicked_camera_share_screen2");
      btnLocalVideo.classList.add("button-clicked_camera_share_screen");
    } 
    // btnLocalVideo.style.backgroundColor = 'rgb(255,80,80)'
    changeCamPaused2()
    return
  }
  if (isturnOffCameraShareScreen == true) {
    isturnOffCameraShareScreen = false
    // btnLocalVideo.classList.toggle('button-clicked_camera_share_screen2');
    if (btnLocalVideo.classList.contains("button-clicked_camera_share_screen")) {
      btnLocalVideo.classList.remove("button-clicked_camera_share_screen");
      btnLocalVideo.classList.add("button-clicked_camera_share_screen2");
    } 
    // btnLocalVideo.style.backgroundColor = 'rgba(148, 148, 148, 0.9)'
    changeCamPaused2()
    return
  }
}

const changeCamPaused2 = async () => {
  if (isturnOffCameraShareScreen == true) {

    if (screenVideoProducer) {
      try {
        // await sig('pause-producer', { producerId: producer.id });
        await screenVideoProducer.pause();
      } catch (e) {
        console.error(e);
      }
    }
  } else {
    if (screenVideoProducer) {
      try {
        // await sig('resume-producer', { producerId: producer.id });
        await screenVideoProducer.resume();
      } catch (e) {
        console.error(e);
      }
    }
  }
}
// -----------------Turn off Mic Share Screen--------------

const getMicShareScreenPausedState = () => {
  let btnLocalAudio = document.getElementById('btnMicShareScreen');
  if (isturnOffMicShareScreen == false) {
    isturnOffMicShareScreen = true
    // btnLocalAudio.classList.toggle('button-clicked_mic_share_screen');
    if (btnLocalAudio.classList.contains("button-clicked_mic_share_screen2")) {
      btnLocalAudio.classList.remove("button-clicked_mic_share_screen2");
      btnLocalAudio.classList.add("button-clicked_mic_share_screen");
    } 
    console.log("on")
    changeMicPaused2()
    return
  }
  if (isturnOffMicShareScreen == true) {
    isturnOffMicShareScreen = false
    console.log("off")
    // btnLocalAudio.classList.toggle('button-clicked_mic_share_screen');
    if (btnLocalAudio.classList.contains("button-clicked_mic_share_screen")) {
      btnLocalAudio.classList.remove("button-clicked_mic_share_screen");
      btnLocalAudio.classList.add("button-clicked_mic_share_screen2");
    } 
    changeMicPaused2()
    return
  }
}

const changeMicPaused2 = async () => {
  if (isturnOffMicShareScreen == true) {
    if (screenAudioProducer) {
      try {
        await screenAudioProducer.pause();
      } catch (e) {
        console.error(e);
      }
    }
  } else {
    if (screenAudioProducer) {
      try {
        await screenAudioProducer.resume();
      } catch (e) {
        console.error(e);
      }
    }
  }
}

//_______________________________________________________________Turn off Cam____________________________________________________________________________


const getCamPausedState = () => {
  let btnLocalVideo = document.getElementById('btnLocalVideo');
  if (isturnOffCamera == false) {
    isturnOffCamera = true
    // btnLocalVideo.classList.toggle('button-clicked_camera');
    btnLocalVideo.style.backgroundColor = 'rgb(255,80,80)'
    console.log("on")
    changeCamPaused()
    return
  }
  if (isturnOffCamera == true) {
    isturnOffCamera = false
    console.log("off")
    // btnLocalVideo.classList.toggle('button-clicked_camera');
    btnLocalVideo.style.backgroundColor = 'rgba(148, 148, 148, 0.9)'
    changeCamPaused()
    return
  }
}

const changeCamPaused = async () => {
  if (isturnOffCamera == true) {
    console.log("aklkks")
    if (videoProducer) {
      try {
        // await sig('pause-producer', { producerId: producer.id });
        await videoProducer.pause();
      } catch (e) {
        console.error(e);
      }
    }
    // pauseProducer(videoProducer);
  } else {
    if (videoProducer) {
      try {
        // await sig('resume-producer', { producerId: producer.id });
        await videoProducer.resume();
      } catch (e) {
        console.error(e);
      }
    }
    // resumeProducer(videoProducer);
  }
}


//_______________________________________________________________Turn off Mic____________________________________________________________________________
const getMicPausedState = () => {
  let btnLocalAudio = document.getElementById('btnLocalAudio');
  if (isturnOffMic == false) {
    isturnOffMic = true
    // btnLocalAudio.classList.toggle('button-clicked_mic');
    btnLocalAudio.style.backgroundColor = 'rgb(255,80,80)'
    console.log("on")
    changeMicPaused()
    return
  }
  if (isturnOffMic == true) {
    isturnOffMic = false
    console.log("off")
    // btnLocalAudio.classList.toggle('button-clicked_mic');
    btnLocalAudio.style.backgroundColor = 'rgba(148, 148, 148, 0.9)'
    changeMicPaused()
    return
  }
}

const changeMicPaused = async () => {
  if (isturnOffMic == true) {
    console.log("akllllkks")
    if (audioProducer) {
      try {
        // await sig('pause-producer', { producerId: producer.id });
        await audioProducer.pause();
      } catch (e) {
        console.error(e);
      }
    }
    // pauseProducer(audioProducer);
  } else {
    if (audioProducer) {
      try {
        // await sig('resume-producer', { producerId: producer.id });
        await audioProducer.resume();
      } catch (e) {
        console.error(e);
      }
    }
    // resumeProducer(audioProducer);
  }
}

const changeShowState = async()=>{
  const largeScreen = document.querySelector('.largeScreen')
  console.log(1)
  let child = largeScreen.children[0]
  if(child){
    const origin_div = document.getElementById(listOfVideoFrame[child.id])
    origin_div.appendChild(child)
    // child.style.height = '120px'
    // child.style.width = '200px'
    if (child.classList.contains("video2")) {
      child.classList.remove("video2");
      child.classList.add("video");
    } 
    // child.style.bottom = '0px'
  }
  largeScreen.style.display = 'none'
  
  const videoContainer = document.getElementById('videoContainer')
  if (videoContainer.classList.contains("videoContainer_state1")) {
    videoContainer.classList.remove("videoContainer_state1");
    videoContainer.classList.add("videoContainer_state2");
  } 
  // else {
  //   videoContainer.classList.remove("videoContainer_state2");
  //   videoContainer.classList.add("videoContainer_state1");
  // }
  const button = document.getElementById('change_size')
  button.style.display = 'none'

  
}

const participant_div = document.querySelector('.participantsColumn');
const chat_div = document.querySelector('.chatColumn')
const changeToChatMode = async()=>{
  participant_div.style.display = 'none'
  chat_div.style.display = 'block'

}
const changeToParticipantMode = async()=>{
  chat_div.style.display = 'none'
  participant_div.style.display = 'block'
  
}
const getOutTheRoom = ()=>{
  console.log(1)
  window.close();
  // window.top.close();
  
}
// _________________________________________________________Buttons_________________________________________________________________
const leave_button = document.getElementById('leave-btn')
btnLocalVideo.addEventListener('click', getCamPausedState)
btnLocalAudio.addEventListener('click', getMicPausedState)
btnLocalScreen.addEventListener('click', getShareScreenPausedState)
leave_button.addEventListener('click', getOutTheRoom)
change_size.addEventListener('click', changeShowState)
move_to_chat.addEventListener('click', changeToChatMode)
move_to_participant.addEventListener('click', changeToParticipantMode)
// btnCamShareScreen.addEventListener('click',getCamShareScreenPausedState)
// btnMicShareScreen.addEventListener('click',getMicShareScreenPausedState)


let largeScreen = document.querySelector('.largeScreen')
let userIdInDisplayFrame = null;

let expandVideoFrame = (e) => {
  let child = largeScreen.children[0]
  if(child){
    //Neu video tren large screen chinhs la video dc click
    if(child.id == e.currentTarget.id){
      return
    }
    
    const origin_div = document.getElementById(listOfVideoFrame[child.id])
    origin_div.appendChild(child)
    // child.style.height = '120px'
    // child.style.width = '200px'
    if (child.classList.contains("video2")) {
      child.classList.remove("video2");
      child.classList.add("video");
    } 
    // child.style.bottom = '0px'
  }
  // const largeScreen = document.querySelector('.largeScreen')
  //Hien large screen tranhs truwongf howpj large screen dang bi che boi video
  largeScreen.style.display = 'block'

  
  const videoContainer = document.getElementById('videoContainer')
  if (videoContainer.classList.contains("videoContainer_state2")) {
    videoContainer.classList.remove("videoContainer_state2");
    videoContainer.classList.add("videoContainer_state1");
  } 
  const button = document.getElementById('change_size')
  button.style.display = 'block'

  // displayFrame.style.display = 'block'
  largeScreen.appendChild(e.currentTarget)
  // userIdInDisplayFrame = e.currentTarget.id

  if (e.currentTarget.classList.contains("video")) {
    e.currentTarget.classList.remove("video");
    e.currentTarget.classList.add("video2");
  } 
  // e.currentTarget.style.height = '450px'
  // e.currentTarget.style.width = '800px'
  // e.currentTarget.style.right = '0px'


}


let localVideo =document.getElementById('localVideo')
localVideo.addEventListener('click', expandVideoFrame)

// ====================================Chat==========================
const form = document.getElementById("message_form");
const input = document.getElementById("input");
const chat_box = document.getElementById("chat_box");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value) {
    console.log(input.value)
    socket.emit("chat", input.value);
    input.value = "";
  }
});
let checkisHost;
socket.on("isHost",(isHost)=>{
  checkisHost = isHost
})
socket.on("sendMsg", (from, msg) => {
  const message__body = document.createElement('div');
  

  const message__author = document.createElement('strong');
  message__author.textContent = `${decodeURI(host_list2[from])}`;

  const message__text = document.createElement('p');
  
  message__text.textContent = `${msg}`;

  if(checkisHost == 1){
    message__body.classList.add('message__body_host');
    message__author.classList.add('message__author_host');
    message__text.classList.add('message__text_host');
    checkisHost = 0
  }else{
    message__body.classList.add('message__body_client');
    message__author.classList.add('message__author_client');
    message__text.classList.add('message__text_client');
    checkisHost = 0
  }

  message__body.appendChild(message__author);
  message__body.appendChild(message__text);

  
  chat_box.appendChild(message__body);
  // window.scrollTo(0, document.body.scrollHeight);
});

