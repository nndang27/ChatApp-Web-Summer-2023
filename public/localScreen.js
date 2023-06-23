const React = require ('react');
// const render = require('react-dom');

const ReactDOM = require('react-dom/client');

function VideoPlayer(id){
    // return (
    //     <video id="c" autoplay class="video" playsinline> </video>
    // );
    var videoElement = document.createElement('video');
    videoElement.id = `${id}`;
    videoElement.autoplay = true;
    videoElement.className = 'video';
    videoElement.setAttribute('playsinline', '');

    return videoElement;
  }
  
function addVideoToElement(elementId, component) {
  const targetElement = document.querySelector(`.${elementId}`);

  console.log(targetElement)
  // ReactDOM.render(component, targetElement);
  const root = ReactDOM.createRoot(targetElement); 
  const myElementRef = React.useRef(null);

  useEffect(() => {
    // Access the element by its id in the useEffect hook
    const myElement = myElementRef.current;
    if (myElement) {
      // Perform operations on the element
      console.log(myElement);
    }
  }, []);
  var videoElement = React.createElement(
    'video',
    { id: `${component}` ,
      autoPlay: true,
      className: 'video',
      ref: {myElementRef}},
  );
  console.log(videoElement)
  root.render(videoElement);
  console.log(targetElement)
  const node = myRef.current;
  console.log("node",node)
}
module.exports = {
  addVideoToElement: addVideoToElement,
  VideoPlayer: VideoPlayer
};
