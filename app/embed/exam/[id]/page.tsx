import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic"; // Ensure fresh data on reload

export default async function EmbedExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const examSet = await prisma.examSet.findUnique({
    where: { id },
    include: {
      questions: true,
    },
  });

  if (!examSet) {
    return notFound();
  }

  // Calculate meta info
  const timeLimit = examSet.timeLimitMinutes || "ไม่จำกัด";
  const questionCount = examSet.questions.length;
  const totalPoints = examSet.questions.reduce((sum, q) => sum + (q.points || 1), 0);

  // Status checks
  const now = new Date();
  const scheduledStart = examSet.scheduledStart ? new Date(examSet.scheduledStart) : null;
  const scheduledEnd = examSet.scheduledEnd ? new Date(examSet.scheduledEnd) : null;
  
  let statusText = "เปิดรับคำตอบ";
  let statusColor = "bg-green-100 text-green-700";
  let canStart = true;

  if (!examSet.isActive) {
    statusText = "ปิดรับคำตอบ";
    statusColor = "bg-red-100 text-red-700";
    canStart = false;
  } else if (scheduledStart && now < scheduledStart) {
    statusText = "ยังไม่เปิดให้สอบ";
    statusColor = "bg-amber-100 text-amber-700";
    canStart = false;
  } else if (scheduledEnd && now > scheduledEnd) {
    statusText = "หมดเวลาสอบ";
    statusColor = "bg-gray-100 text-gray-700";
    canStart = false;
  }

  // Use absolute URL to make sure target="_blank" navigates outside properly if embedded deeply
  // But standard absolute path starting with `/` relative to origin is fine too.
  const examUrl = `/exam/${examSet.id}`;

  return (
    <div className="w-full flex items-center justify-center min-h-screen bg-transparent p-4 font-sans">
      <div className="w-full max-w-lg bg-card rounded-[24px] shadow-sm border border-border overflow-hidden ring-1 ring-black/5 hover:shadow-md transition-shadow duration-300">
        
        {/* Banner Area */}
        <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
          {examSet.coverImage ? (
            <img 
              src={examSet.coverImage} 
              alt={examSet.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-100 via-indigo-50 to-blue-100 p-4">
              {/* Decorative shapes to make it look illustrative */}
              <div className="absolute top-[-20%] left-[-10%] w-32 h-32 bg-pink-200/50 rounded-full blur-2xl"></div>
              <div className="absolute bottom-[-20%] right-[-10%] w-40 h-40 bg-blue-200/50 rounded-full blur-2xl"></div>
              
              <div className="absolute inset-0 flex items-center justify-center opacity-70 pointer-events-none">
                <Icon name="document" size="xl" className="text-blue-500/20 w-32 h-32 absolute -translate-x-12 translate-y-4" />
                <Icon name="check-circle" size="xl" className="text-teal-500/20 w-24 h-24 absolute translate-x-16 -translate-y-6" />
              </div>
            </div>
          )}
          
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start">
            {/* Subject / Category Badge */}
            <div className="bg-white/80 backdrop-blur-md text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
              {examSet.subject || "บททดสอบ"}
            </div>
            
            {/* Status Badge */}
            <div className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 ${statusColor}`}>
               <span className={`w-2 h-2 rounded-full ${canStart ? 'bg-green-500 animate-pulse' : 'bg-current opacity-70'}`}></span>
              {statusText}
            </div>
          </div>
          
          {/* Center decorative icons to mimic the graphic */}
          <div className="absolute inset-0 flex items-center justify-center opacity-70 pointer-events-none">
            <Icon name="document" size="xl" className="text-blue-500/20 w-32 h-32 absolute -translate-x-12 translate-y-4" />
            <Icon name="check-circle" size="xl" className="text-teal-500/20 w-24 h-24 absolute translate-x-16 -translate-y-6" />
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 md:p-8 bg-white">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4 leading-tight tracking-tight">
            {examSet.title}
          </h1>
          
          {/* Meta Data */}
          <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-teal-600 mb-8 border-l-4 border-teal-500 pl-3">
            <span className="flex items-center gap-1.5">
              <Icon name="clock" size="sm" />
              {timeLimit}
              {typeof timeLimit === "number" && " min"}
            </span>
            <span className="text-teal-300">|</span>
            <span className="flex items-center gap-1.5">
              <Icon name="list" size="sm" />
              {questionCount} questions
            </span>
            <span className="text-teal-300">|</span>
            <span className="flex items-center gap-1.5">
              <Icon name="star" size="sm" />
              {totalPoints} pts
            </span>
          </div>

          {/* Action Button */}
          {canStart ? (
            <a 
              href={examUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center justify-center w-full gap-2 px-6 py-4 bg-[#0A0A0A] hover:bg-black text-white text-lg font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-xl"
            >
              Start Exam
              <Icon name="arrow-right" size="sm" className="group-hover:translate-x-1 transition-transform" />
            </a>
          ) : (
             <button 
              disabled
              className="flex items-center justify-center w-full gap-2 px-6 py-4 bg-gray-100 text-gray-400 text-lg font-bold rounded-xl cursor-not-allowed"
            >
              <Icon name="lock" size="sm" />
              ไม่สามารถทำข้อสอบได้
            </button>
          )}

          {/* Footer Note */}
          <p className="text-center text-xs text-gray-400 mt-4">
            Powered by MasterExam • ข้อสอบจะถูกเปิดในหน้าต่างใหม่
          </p>
        </div>
      </div>
    </div>
  );
}
