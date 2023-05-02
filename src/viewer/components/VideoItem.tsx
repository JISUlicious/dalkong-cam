
interface SavedVideoProps {
  title: string,
  url: string
}
export function VideoItem ({title, url}: SavedVideoProps) {
  return (<div className="video-item">
    <video className="video-item-content" src={url} controls></video>
    {title}
  </div>);
}