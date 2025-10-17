import { useEffect, useState } from "react";

const API_KEY = "AIzaSyAzYodtLjzo8_Syc9ZJJz6h20Q8Fa1pGzU"; 
const CHANNEL_ID = "UCY6m20ZtWVjAtbGqcqTYQng"; 
const INITIAL_RESULTS = 6; // How many videos to load initially
const LOAD_MORE_COUNT = 6; // How many more to load each time

function Lessons() {
  const [videos, setVideos] = useState([]);
  const [maxResults, setMaxResults] = useState(INITIAL_RESULTS);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=${maxResults}`
        );
        const data = await response.json();
        const videoUrls = data.items
          .filter(item => item.id.kind === "youtube#video")
          .map(item => ({
            id: item.id.videoId,
            title: item.snippet.title
          }));
        setVideos(videoUrls);
      } catch (error) {
        console.error("Error fetching YouTube videos:", error);
      }
    };

    fetchVideos();
  }, [maxResults]);

  const loadMore = () => {
    setMaxResults(prev => prev + LOAD_MORE_COUNT);
  };

  if (videos.length === 0) {
    return <p className="text-center mt-8">Loading videos...</p>;
  }

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-blue-600 text-center mb-6">
        Lessons
      </h2>
      <p className="text-gray-700 text-center mb-8">
        Here you'll find all my educational videos and tutorials.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {videos.map((video) => (
          <div key={video.id} className="aspect-video shadow-md rounded overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${video.id}`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
            <p className="mt-2 text-center text-gray-700 font-medium">{video.title}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={loadMore}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          Load More
        </button>
      </div>
    </div>
  );
}

export default Lessons;
