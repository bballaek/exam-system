"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import Icon from "@/components/Icon";

interface StudentData {
  firstName: string;
  lastName: string;
  studentId: string;
  studentNumber: string;
  classroom: string;
}

export default function StudentInfoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<StudentData>({
    firstName: "",
    lastName: "",
    studentId: "",
    studentNumber: "",
    classroom: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const studentData: StudentData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      studentId: formData.studentId.trim(),
      studentNumber: formData.studentNumber.trim(),
      classroom: formData.classroom.trim(),
    };

    sessionStorage.setItem("studentInfo", JSON.stringify(studentData));
    router.push("/exam");
  };

  const inputFields = [
    { id: "firstName", label: "ชื่อจริง", type: "text", icon: "user" as const },
    { id: "lastName", label: "นามสกุล", type: "text", icon: "user" as const },
    { id: "studentId", label: "รหัสนักเรียน", type: "text", icon: "document" as const },
    { id: "studentNumber", label: "เลขที่", type: "number", icon: "bookmark" as const },
    { id: "classroom", label: "ห้องเรียน", type: "text", icon: "home" as const },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 min-h-screen bg-surface">
        <div className="max-w-md mx-auto">
          {/* Card - Updated styling */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="border-b border-border bg-muted px-6 py-5 text-center">
              <h1 className="flex items-center justify-center gap-2 text-lg font-bold text-gray-900">
                <Icon name="user" size="md" className="text-indigo-600" />
                ข้อมูลผู้สอบ
              </h1>
              <p className="text-sm text-gray-500 mt-1">กรอกข้อมูลก่อนเริ่มทำข้อสอบ</p>
            </div>

            {/* Content */}
            <div className="p-6">
              <form id="studentForm" onSubmit={handleSubmit}>
                {inputFields.map((field) => (
                  <div key={field.id} className="mb-4">
                    <label
                      htmlFor={field.id}
                      className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700"
                    >
                      <Icon name={field.icon} size="xs" className="text-gray-400" />
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      id={field.id}
                      name={field.id}
                      value={formData[field.id as keyof StudentData]}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-border rounded-lg text-gray-900 bg-card focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-gray-400"
                      placeholder={`กรอก${field.label}`}
                    />
                  </div>
                ))}

                {/* Submit Button - Updated styling */}
                <button
                  type="submit"
                  id="submitBtn"
                  disabled={isSubmitting}
                  className={`w-full mt-4 py-4 rounded-lg flex items-center justify-center gap-2 text-base font-bold transition-all ${
                    isSubmitting
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Icon name="spinner" size="sm" />
                      กำลังโหลดข้อสอบ...
                    </>
                  ) : (
                    <>
                      <Icon name="document" size="sm" />
                      เริ่มทำข้อสอบ
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

