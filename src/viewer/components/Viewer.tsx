import "../../common/styles/Viewer.scss";
import {useParams} from "react-router-dom";
import {CameraItem} from "../../camera/components/CameraItem";

export function Viewer () {
  const param = useParams();

  const listCameras = ["cam1", "cam2", "cam3", "cam4"];
  return <div className="viewer body-content">
    <h1>Viewer</h1>
    {JSON.stringify(param)}
    <div className="list-cameras-wrapper">
      list of camera
      <ul>
        {listCameras.map((cam, i) => {
          return (<li key={i}>
            <CameraItem title={cam} url={`/camera/${cam}`} />
          </li>);
        })}
      </ul>
    </div>
  </div>;
}