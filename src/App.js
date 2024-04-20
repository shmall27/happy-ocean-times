import { Canvas } from "@react-three/fiber";
import { useState, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import { useVectorDb } from "./hooks/useVectorDb";
import { ImagePlane } from "./components/ImagePlane";

const INCREMENTS = [1, 2, 3, 10, 20, 50, 100, 250, 500, 750, 1000];

const App = () => {
  const [images, setImages] = useState([]);

  const { db, isLoading } = useVectorDb();

  const handleImageUpload = async (files) => {
    if (!db || isLoading) {
      console.log("DB is not ready or still loading.");
      return;
    }

    for (let [index, file] of Array.from(files).entries()) {
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

            if (INCREMENTS.includes(setImages.length + index + 1)) {
              const newEmbeddings = await db.project_all_embeddings();
              const newPositions = newEmbeddings.map(
                (embedding) => embedding.vector
              );
              setImages((prevImages) => {
                let imagesCopy = prevImages.map((img, idx) => ({
                  url: img.url,
                  position: newPositions[idx],
                }));
                imagesCopy.push({
                  url: imageUrl,
                  position: newPositions[newPositions.length - 1],
                });
                return imagesCopy;
              });
            } else {
              const singleEmbedding = await db.project_single_embedding(
                imageVector
              );
              setImages((prevImages) => {
                let imagesCopy = [...prevImages];
                imagesCopy.push({
                  url: imageUrl,
                  position: singleEmbedding,
                });
                return imagesCopy;
              });
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
    handleImageUpload(files);
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleReset = async () => {
    if (db) {
      await db.clear();
      setImages([]);
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
      <Canvas
        camera={{ position: [0, 0, 50] }}
        gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
        linear
      >
        <OrbitControls minZoom={0} maxZoom={Infinity} />
        {images.map((image, index) => {
          if (!image || !image.position) {
            return null;
          }
          return (
            <ImagePlane
              key={index}
              position={[
                image.position[0] * (1 + images.length / 5),
                image.position[1] * (1 + images.length / 5),
                image.position[2] * (1 + images.length / 5),
              ]}
              path={image.url}
            />
          );
        })}
      </Canvas>
    </div>
  );
};

export default App;
