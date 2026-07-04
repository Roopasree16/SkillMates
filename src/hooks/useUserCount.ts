import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUserCount = () => {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { count, error } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        if (error) {
          console.error("Error fetching user count:", error);
          return;
        }

        setCount(count || 0);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, []);

  return { count, loading };
};
