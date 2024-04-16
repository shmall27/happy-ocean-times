import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import { OrbitControls } from "@react-three/drei";

import { useVectorDb } from "./hooks/useVectorDb";
import { ImagePlane } from "./components/ImagePlane";

const INCREMENTS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 50, 100, 250, 500, 750, 1000,
];

const App = () => {
  const [imageUrls, setImageUrls] = useState([]);
  const [imagePositions, setImagePositions] = useState([]);

  const { db, isLoading } = useVectorDb();

  const handleImageUpload = async (files) => {
    if (!db || isLoading) {
      console.log("DB is not ready or still loading.");
      return;
    }

    for (let file of files) {
      if (file && file.type.startsWith("image/")) {
        const formData = new FormData();
        formData.append("image", file);

        try {
          const response = await fetch("http://localhost:5001/get-vector", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            const imageUrl = URL.createObjectURL(file);
            const imageVector = data.vector;

            await db.insert(imageUrl, imageVector, []);
            setImageUrls((prevImages) => [...prevImages, imageUrl]);

            if (INCREMENTS.includes(imagePositions.length + 1)) {
              // This is when we run the PCA on the entire set of images
              const newEmbeddings = await db.project_all_embeddings();
              const vectors = newEmbeddings.map(
                (embedding) => embedding.vector
              );
              setImagePositions(vectors);
            } else {
              // This is when we run PCA on just the new image
              const threeDimVector = await db.project_single_embedding(
                imageVector
              );
              setImagePositions((prevPositions) => [
                ...prevPositions,
                threeDimVector.vector,
              ]);
            }
          } else {
            const errorData = await response.json();
            console.error("Server error:", errorData.error);
          }
        } catch (error) {
          console.error("Network error:", error);
        }
      }
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer.files;
    console.log("files", files);
    handleImageUpload(files);
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleReset = async () => {
    if (db) {
      await db.clear();
      setImageUrls([]);
      setImagePositions([]);
    }
  };

  return (
    <div
      id="canvas-container"
      onDrop={onDrop}
      onDragOver={onDragOver}
      style={{ width: "100vw", height: "100vh" }}
    >
      <button onClick={handleReset}>Reset</button>
      <Canvas camera={{ position: [0, 0, 50] }}>
        <OrbitControls minZoom={0} maxZoom={Infinity} />
        {imageUrls.map((image, index) => {
          console.log("position", imagePositions[index], "url", image);
          if (imagePositions[index]) {
            return (
              <ImagePlane
                key={index}
                position={[
                  imagePositions[index][0] * (1 + imageUrls.length / 10),
                  imagePositions[index][1] * (1 + imageUrls.length / 10),
                  imagePositions[index][2] * (1 + imageUrls.length / 10),
                ]}
                path={image}
              />
            );
          }
        })}
      </Canvas>
    </div>
  );
};

export default App;
