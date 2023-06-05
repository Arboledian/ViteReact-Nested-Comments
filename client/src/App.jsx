import { Route, Routes } from "react-router-dom";
import { Post } from "./components/Post";
import { PostList } from "./components/PostLists";
import { PostProvider } from "./context/PostContext";

export default function App() {
  return (
    <div className="container">
      <Routes>
        <Route path="/" element={<PostList />} />
        <Route
          path="posts/:id"
          element={
            <PostProvider>
              <Post />
            </PostProvider>
          }
        />
      </Routes>
    </div>
  );
}
