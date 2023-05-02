import {useNavigate} from "react-router-dom";

interface CameraItemProps {
  title: string,
  url: string
}
export function CameraItem({title, url}: CameraItemProps) {
  const navigate = useNavigate();
  function onClick () {
    navigate(url);
  }

  return (<div className="camera-item" onClick={onClick}>
    <h1>{title}</h1>
    <video className="camera-item-content" src={url}></video>
  </div>);
}