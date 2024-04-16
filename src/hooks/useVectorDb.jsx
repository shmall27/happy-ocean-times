import { useEffect, useState } from "react";

export const useVectorDb = () => {
  const [db, setDb] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // to handle component unmount
    const loadWasmModule = async () => {
      try {
        const { Db } = await import("perkins-db");
        const dbInstance = await new Db();
        if (isMounted) {
          setDb(dbInstance);
          setIsLoading(false); // Set loading false after successful load
        }
      } catch (error) {
        console.error("Error loading the WASM module:", error);
        if (isMounted) {
          setIsLoading(false); // Ensure loading state is updated even if there's an error
        }
      }
    };
  
    loadWasmModule();
  
    return () => {
      isMounted = false; // Clean up to prevent setting state after unmount
    };
  }, []); // Empty dependency array ensures this effect runs only once after the initial render

  return { db, isLoading };
};
