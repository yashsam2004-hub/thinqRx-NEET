"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

export interface Course {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isComingSoon: boolean;
}

export interface CourseEnrollment {
  plan: "free" | "plus" | "pro";
  status: "active" | "expired" | "cancelled";
  validUntil: string | null;
}

interface CourseContextType {
  currentCourse: Course | null;
  enrollment: CourseEnrollment | null;
  allCourses: Course[];
  isLoading: boolean;
  switchCourse: (courseId: string) => void;
  refreshEnrollment: () => Promise<void>;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load courses from API
  const loadCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/courses");
      if (res.ok) {
        const data = await res.json();
        setAllCourses(data.courses || []);
        return data.courses || [];
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
    }
    return [];
  }, []);

  // Load enrollment for current course
  const loadEnrollment = useCallback(async (courseId: string) => {
    try {
      const res = await fetch(`/api/enrollments/${courseId}`);
      if (res.ok) {
        const data = await res.json();
        setEnrollment(data.enrollment || { plan: "free", status: "active", validUntil: null });
      }
    } catch (error) {
      console.error("Failed to load enrollment:", error);
      setEnrollment({ plan: "free", status: "active", validUntil: null });
    }
  }, []);

  // Initialize course from localStorage or default to GPAT
  useEffect(() => {
    const initializeCourse = async () => {
      setIsLoading(true);
      
      const courses = await loadCourses();
      
      if (courses.length === 0) {
        setIsLoading(false);
        return;
      }

      // Try to get stored course from localStorage
      const storedCourseId = typeof window !== "undefined" 
        ? localStorage.getItem("currentCourseId") 
        : null;

      let selected = courses.find((c: Course) => c.id === storedCourseId);
      
      // Default to GPAT if no stored course or stored course not found
      if (!selected) {
        selected = courses.find((c: Course) => c.code === "gpat") || courses[0];
      }

      if (selected) {
        setCurrentCourse(selected);
        await loadEnrollment(selected.id);
      }

      setIsLoading(false);
    };

    initializeCourse();
  }, [loadCourses, loadEnrollment]);

  // Switch to a different course
  const switchCourse = useCallback((courseId: string) => {
    const course = allCourses.find((c) => c.id === courseId);
    if (!course) return;

    setCurrentCourse(course);
    localStorage.setItem("currentCourseId", courseId);
    
    // Load enrollment for new course
    loadEnrollment(courseId);

    // Redirect to course home if on a course-specific page
    if (pathname?.startsWith("/courses/") || pathname?.startsWith("/subjects")) {
      router.push(`/courses/${courseId}`);
    }
  }, [allCourses, loadEnrollment, pathname, router]);

  // Refresh enrollment (after payment, upgrade, etc.)
  const refreshEnrollment = useCallback(async () => {
    if (currentCourse) {
      await loadEnrollment(currentCourse.id);
    }
  }, [currentCourse, loadEnrollment]);

  const value: CourseContextType = {
    currentCourse,
    enrollment,
    allCourses,
    isLoading,
    switchCourse,
    refreshEnrollment,
  };

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}

export function useCourse() {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error("useCourse must be used within a CourseProvider");
  }
  return context;
}

/**
 * Hook to get current course ID (throws if no course selected)
 */
export function useCurrentCourseId(): string {
  const { currentCourse } = useCourse();
  if (!currentCourse) {
    throw new Error("No course selected");
  }
  return currentCourse.id;
}

/**
 * Hook to check if user has premium access
 */
export function useIsPremium(): boolean {
  const { enrollment } = useCourse();
  return enrollment?.plan === "plus" || enrollment?.plan === "pro";
}

/**
 * Hook to get user's current plan
 */
export function useCurrentPlan(): "free" | "plus" | "pro" {
  const { enrollment } = useCourse();
  return enrollment?.plan || "free";
}
