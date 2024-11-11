"use client";
import { useState } from "react";
import { Card, Input } from "antd";

const PostList = ({ posts = [], onPostSelect, selectedPostId }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPosts = posts?.filter((post) =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

    const handlePostClick = (post) => {
        onPostSelect(post.post_id);
    };

  return (
    <div className="post-list w-full flex flex-col">
      <div className="sticky top-0 bg-white z-10 p-4 mb-4">
        <Input
          placeholder="Search posts by title..."
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
      </div>

      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-150px)] p-4 space-y-4">
        {filteredPosts?.map((post) => (
          <Card
            key={post.post_id}
            title={post.title}
            hoverable
            onClick={() => handlePostClick(post)}
            className={`w-full cursor-pointer transition-all hover:shadow-lg
            ${selectedPostId === post.post_id ? "border-blue-500 border-2" : ""}`}
          >
            <p className="text-gray-600 line-clamp-2">{post.content}</p>
            <div className="mt-2 text-sm text-gray-500">
              Posted on: {new Date(post.createdAt).toLocaleDateString()}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PostList;
