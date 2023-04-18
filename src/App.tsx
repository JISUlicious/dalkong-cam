import React from 'react';
import './App.css';
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import {Auth} from "./components/Auth";
import {Main} from "./components/Main";
import {CreateRoom} from "./components/CreateRoom";
import {Room} from "./components/Room";


const router = createBrowserRouter([
  {
    path: "/",
    element: <Auth />
  },
  {
    path: "/main",
    element: <Main />
  },
  {
    path: "/room/create",
    element: <CreateRoom />
  },
  {
    path: "/room/:roomId",
    element: <Room />
  }
])
function App() {
  return (
      <RouterProvider router={router}/>

  );
}

export default App;
