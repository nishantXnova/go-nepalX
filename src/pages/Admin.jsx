import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function Admin() {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate("/");
                return;
            }

            const { data, error } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", user.id)
                .eq("role", "admin")
                .single();

            if (error || !data) {
                navigate("/");
                return;
            }

            setAuthorized(true);
            setLoading(false);
        };

        checkAdmin();
    }, [navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl font-medium text-gray-600 animate-pulse">Checking access...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-12">
            <h1 className="text-4xl font-extrabold mb-4 text-gray-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-lg text-green-600 font-semibold border-l-4 border-green-500 pl-4 bg-green-50 py-3 rounded-r-lg">
                You are authorized
            </p>
        </div>
    );
}
