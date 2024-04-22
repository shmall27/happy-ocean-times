import { useEffect, useState } from "react";

export const useVectorDb = () => {
  const [db, setDb] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadWasmModule = async () => {
      try {
        const { Db } = await import("perkins-db");
        const dbInstance = await new Db();
        if (isMounted) {
          setDb(dbInstance);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading the WASM module:", error);
        if (isMounted) {
          setIsLoading(false); 
        }
      }
    };
  
    loadWasmModule();
  
    return () => {
      isMounted = false;
    };
  }, []);

  return { db, isLoading };
};
