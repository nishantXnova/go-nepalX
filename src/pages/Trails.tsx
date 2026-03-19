import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mountain, MessageSquare, ThumbsUp, Plus, MapPin, Calendar, Info, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSafeErrorMessage } from "@/utils/errorUtils";

interface TrailReport {
    id: string;
    trail: string;
    user: string;
    status: "Clear" | "Snow" | "Closed" | "Crowded";
    report: string;
    upvotes: number;
    date: string;
}

const Trails = () => {
    const { toast } = useToast();
    const [reports, setReports] = useState<TrailReport[]>([
        {
            id: "1",
            trail: "Everest Base Camp",
            user: "Pasang Sherpa",
            status: "Clear",
            report: "The trail from Namche to Tengboche is perfectly clear. Small patches of ice near Dingboche, but no crampons needed.",
            upvotes: 42,
            date: "2 hours ago"
        },
        {
            id: "2",
            trail: "Annapurna Circuit",
            user: "David Chen",
            status: "Snow",
            report: "Heavy snow at Thorong La Pass. Several groups turned back today. Wait for better conditions if you don't have proper gear.",
            upvotes: 156,
            date: "5 hours ago"
        },
        {
            id: "3",
            trail: "Mardi Himal",
            user: "Anjali K.",
            status: "Clear",
            report: "Beautiful sunrise at High Camp! Trail is dry and stable. Forest section is a bit muddy but manageable.",
            upvotes: 28,
            date: "1 day ago"
        }
    ]);

    const [isAdding, setIsAdding] = useState(false);
    const [newReport, setNewReport] = useState({ trail: "", report: "", status: "Clear" as any });

    const handleUpvote = (id: string) => {
        setReports(prev => prev.map(r => r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r));
        toast({
            title: "Upvoted!",
            description: "Thanks for verifying this report.",
        });
    };

    const handleAddReport = () => {
        if (!newReport.trail || !newReport.report) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: getSafeErrorMessage("Please provide both trail name and your report."),
            });
            return;
        }

        const report: TrailReport = {
            id: Date.now().toString(),
            trail: newReport.trail,
            user: "You",
            status: newReport.status,
            report: newReport.report,
            upvotes: 0,
            date: "Just now"
        };

        setReports([report, ...reports]);
        setIsAdding(false);
        setNewReport({ trail: "", report: "", status: "Clear" });
        toast({
            title: "Report Posted!",
            description: "Your live trail report is now visible to others.",
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Clear": return "bg-green-100 text-green-700 border-green-200";
            case "Snow": return "bg-blue-100 text-blue-700 border-blue-200";
            case "Closed": return "bg-red-100 text-red-700 border-red-200";
            case "Crowded": return "bg-orange-100 text-orange-700 border-orange-200";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFDF9]">
            <Navbar />

            <main className="container-wide pt-32 pb-20">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none mb-3">
                                Live Community Board
                            </Badge>
                            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
                                Trail <span className="italic text-accent">Conditions</span>
                            </h1>
                            <p className="text-muted-foreground text-lg max-w-xl">
                                Real-time updates from trekkers currently on the ground. Post your report to help fellow adventurers.
                            </p>
                        </div>
                        <Button
                            onClick={() => setIsAdding(true)}
                            className="bg-[#FB923C] hover:bg-[#E86C35] text-white rounded-full px-6 py-6 h-auto text-base font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Post Live Update
                        </Button>
                    </div>

                    {/* Add Report Form */}
                    <AnimatePresence>
                        {isAdding && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden mb-12"
                            >
                                <div className="bg-white rounded-3xl p-8 border-2 border-orange-100 shadow-xl">
                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-orange-500" />
                                        Share Your Experience
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Trail Name</label>
                                            <Input
                                                placeholder="e.g. Annapurna Base Camp"
                                                value={newReport.trail}
                                                onChange={(e) => setNewReport({ ...newReport, trail: e.target.value })}
                                                className="rounded-xl border-border focus-visible:ring-orange-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Condition</label>
                                            <select
                                                value={newReport.status}
                                                onChange={(e) => setNewReport({ ...newReport, status: e.target.value as any })}
                                                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            >
                                                <option value="Clear">Clear / Dry</option>
                                                <option value="Snow">Snow / Ice</option>
                                                <option value="Closed">Closed / Blocked</option>
                                                <option value="Crowded">Very Crowded</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2 mb-6">
                                        <label className="text-sm font-medium">Report Details</label>
                                        <Textarea
                                            placeholder="What should other trekkers know? (Weather, obstacles, water availability...)"
                                            value={newReport.report}
                                            onChange={(e) => setNewReport({ ...newReport, report: e.target.value })}
                                            className="rounded-xl min-h-[120px] focus-visible:ring-orange-500"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                                        <Button
                                            onClick={handleAddReport}
                                            className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-8"
                                        >
                                            Publish Report
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Reports Feed */}
                    <div className="space-y-6">
                        {reports.map((report) => (
                            <motion.div
                                key={report.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-3xl p-6 md:p-8 border border-border hover:border-orange-200 transition-colors shadow-sm hover:shadow-md"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                            {report.user[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-bold flex items-center gap-2">
                                                {report.trail}
                                                <Badge variant="outline" className={`font-medium border-none ${getStatusColor(report.status)}`}>
                                                    {report.status}
                                                </Badge>
                                            </h4>
                                            <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {report.user}</span>
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {report.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-muted-foreground leading-relaxed mb-6">
                                    {report.report}
                                </p>

                                <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleUpvote(report.id)}
                                        className="text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-full gap-2"
                                    >
                                        <ThumbsUp className="w-4 h-4" />
                                        Helpful ({report.upvotes})
                                    </Button>
                                    <div className="ml-auto flex items-center gap-1 text-xs text-green-600 font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Verified by community
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Trails;
