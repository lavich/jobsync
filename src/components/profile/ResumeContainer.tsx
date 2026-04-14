"use client";
import { Resume, ResumeSection, SectionType } from "@/models/profile.model";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import AddResumeSection, { AddResumeSectionRef } from "./AddResumeSection";
import ContactInfoCard from "./ContactInfoCard";
import { useRef, useState, useEffect } from "react";
import SummarySectionCard from "./SummarySectionCard";
import ExperienceCard from "./ExperienceCard";
import EducationCard from "./EducationCard";
import AiResumeReviewSection from "./AiResumeReviewSection";
import { DownloadFileButton } from "./DownloadFileButton";
import { Button } from "../ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "../ui/use-toast";
import { useRouter } from "next/navigation";
import { applyParsedResume } from "@/actions/profile.actions";
import { AiModel, defaultModel } from "@/models/ai.model";
import { getUserSettings } from "@/actions/userSettings.actions";
import type { ResumeParseResponse } from "@/models/ai.schemas";

function ResumeContainer({ resume }: { resume: Resume }) {
  const resumeSectionRef = useRef<AddResumeSectionRef>(null);
  const router = useRouter();
  const [isFilling, setIsFilling] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AiModel>(defaultModel);

  useEffect(() => {
    getUserSettings().then((result) => {
      if (result.success && result.data?.settings?.ai) {
        const ai = result.data.settings.ai;
        setSelectedModel({ provider: ai.provider || defaultModel.provider, model: ai.model });
      }
    });
  }, []);

  const fillFromFile = async () => {
    setIsFilling(true);
    try {
      const res = await fetch("/api/ai/resume/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: resume.id, selectedModel }),
      });
      const json = await res.json() as { success?: boolean; data?: ResumeParseResponse; error?: string };

      if (!res.ok || !json.success || !json.data) {
        toast({ variant: "destructive", title: "Error", description: json.error ?? "Failed to parse file" });
        return;
      }

      const result = await applyParsedResume(resume.id!, json.data);
      if (!result.success) {
        toast({ variant: "destructive", title: "Error", description: result.error ?? "Failed to apply data" });
        return;
      }

      if (result.filled.length === 0) {
        toast({ description: "All sections are already filled — nothing to update." });
      } else {
        toast({ variant: "success", description: `Filled: ${result.filled.join(", ")}` });
        router.refresh();
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Unexpected error" });
    } finally {
      setIsFilling(false);
    }
  };

  const { title, ContactInfo, ResumeSections } = resume ?? {};
  const summarySection = ResumeSections?.find(
    (section) => section.sectionType === SectionType.SUMMARY
  );
  const experienceSection = ResumeSections?.find(
    (section) => section.sectionType === SectionType.EXPERIENCE
  );
  const educationSection = ResumeSections?.find(
    (section) => section.sectionType === SectionType.EDUCATION
  );
  const openContactInfoDialog = () => {
    resumeSectionRef.current?.openContactInfoDialog(ContactInfo!);
  };
  const openSummaryDialogForEdit = () => {
    resumeSectionRef.current?.openSummaryDialog(summarySection!);
  };
  const openExperienceDialogForEdit = (experienceId: string) => {
    const section: ResumeSection = {
      ...experienceSection!,
      workExperiences: experienceSection?.workExperiences?.filter(
        (exp) => exp.id === experienceId
      ),
    };
    resumeSectionRef.current?.openExperienceDialog(section);
  };
  const openEducationDialogForEdit = (educationId: string) => {
    const section: ResumeSection = {
      ...educationSection!,
      educations: educationSection?.educations?.filter(
        (edu) => edu.id === educationId
      ),
    };
    resumeSectionRef.current?.openEducationDialog(section);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-row justify-between items-center">
          <CardTitle>Resume</CardTitle>
          <CardDescription>
            {resume.FileId && resume.File?.filePath
              ? DownloadFileButton(
                  resume.File?.filePath,
                  title,
                  resume.File?.fileName
                )
              : title}
          </CardDescription>
          <div className="flex items-center gap-1">
            {resume.FileId && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1"
                onClick={fillFromFile}
                disabled={isFilling}
              >
                {isFilling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Fill from file
                </span>
              </Button>
            )}
            <AddResumeSection resume={resume} ref={resumeSectionRef} />
            <AiResumeReviewSection resume={resume} />
          </div>
        </CardHeader>
      </Card>
      {ContactInfo && (
        <ContactInfoCard
          contactInfo={ContactInfo}
          openDialog={openContactInfoDialog}
        />
      )}
      {summarySection && (
        <SummarySectionCard
          summarySection={summarySection}
          openDialogForEdit={openSummaryDialogForEdit}
        />
      )}
      {experienceSection && (
        <ExperienceCard
          experienceSection={experienceSection}
          openDialogForEdit={openExperienceDialogForEdit}
        />
      )}
      {educationSection && (
        <EducationCard
          educationSection={educationSection}
          openDialogForEdit={openEducationDialogForEdit}
        />
      )}
    </>
  );
}

export default ResumeContainer;
