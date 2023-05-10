import React from "react";

const Search = () => {
  return (
    <div className="search">
      <div className="searchForm">
        <input
          type="text"
          name="search"
          id="search-bar"
          placeholder="find a user"
        />
      </div>
      <div className="userChat">
        <img
          className="avatar-img"
          src="https://heinoldheating.com/wp-content/uploads/2020/07/IAFOR-Blank-Avatar-Image-1-768x768.jpg"
          alt=""
        />
        <div className="userChatInfo">
          <span>Dang Dat</span>
        </div>
      </div>
    </div>
  );
};

export default Search;
