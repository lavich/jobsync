"use server";
import prisma from "@/lib/db";
import { handleError } from "@/lib/utils";
import { AddEducationFormSchema } from "@/models/AddEductionForm.schema";
import { AddContactInfoFormSchema } from "@/models/addContactInfoForm.schema";
import { AddExperienceFormSchema } from "@/models/addExperienceForm.schema";
import { AddSummarySectionFormSchema } from "@/models/addSummaryForm.schema";
import { CreateResumeFormSchema } from "@/models/createResumeForm.schema";
import { ResumeSection, SectionType, Summary } from "@/models/profile.model";
import { ResumeParseResponse } from "@/models/ai.schemas";
import { getCurrentUser } from "@/utils/user.utils";
import { APP_CONSTANTS } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { writeFile } from "fs/promises";

export const getResumeList = async (
  page: number = 1,
  limit: number = APP_CONSTANTS.RECORDS_PER_PAGE
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Not authenticated");
    }
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.resume.findMany({
        where: {
          profile: {
            userId: user.id,
          },
        },
        skip,
        take: limit,
        select: {
          id: true,
          profileId: true,
          FileId: true,
          createdAt: true,
          updatedAt: true,
          title: true,
          _count: {
            select: {
              Job: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.resume.count({
        where: {
          profile: {
            userId: user.id,
          },
        },
      }),
    ]);
    return { data, total, success: true };
  } catch (error) {
    const msg = "Failed to get resume list.";
    return handleError(error, msg);
  }
};

export const getResumeById = async (
  resumeId: string
): Promise<any | undefined> => {
  try {
    if (!resumeId) {
      throw new Error("Please provide resume id");
    }
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const resume = await prisma.resume.findUnique({
      where: {
        id: resumeId,
        profile: { userId: user.id },
      },
      include: {
        ContactInfo: true,
        File: true,
        ResumeSections: {
          include: {
            summary: true,
            workExperiences: {
              include: {
                jobTitle: true,
                Company: true,
                location: true,
              },
            },
            educations: {
              include: {
                location: true,
              },
            },
          },
        },
      },
    });
    return { data: resume, success: true };
  } catch (error) {
    const msg = "Failed to get resume.";
    return handleError(error, msg);
  }
};

export const addContactInfo = async (
  data: z.infer<typeof AddContactInfoFormSchema>
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const res = await prisma.resume.update({
      where: {
        id: data.resumeId,
        profile: { userId: user.id },
      },
      data: {
        ContactInfo: {
          connectOrCreate: {
            where: { resumeId: data.resumeId },
            create: {
              firstName: data.firstName,
              lastName: data.lastName,
              headline: data.headline,
              email: data.email!,
              phone: data.phone!,
              address: data.address,
            },
          },
        },
      },
    });
    revalidatePath("/dashboard/profile/resume");
    return { data: res, success: true };
  } catch (error) {
    const msg = "Failed to create contact info.";
    return handleError(error, msg);
  }
};

export const updateContactInfo = async (
  data: z.infer<typeof AddContactInfoFormSchema>
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const res = await prisma.contactInfo.update({
      where: {
        id: data.id,
        resume: { profile: { userId: user.id } },
      },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        headline: data.headline,
        email: data.email!,
        phone: data.phone!,
        address: data.address,
      },
    });
    revalidatePath("/dashboard/profile/resume");
    return { data: res, success: true };
  } catch (error) {
    const msg = "Failed to update contact info.";
    return handleError(error, msg);
  }
};

export const createResumeProfile = async (
  title: string,
  fileName: string,
  filePath?: string
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    //check if title exists
    const value = title.trim().toLowerCase();

    const titleExists = await prisma.resume.findFirst({
      where: {
        title: value,
      },
    });

    if (titleExists) {
      throw new Error("Title already exists!");
    }

    const profile = await prisma.profile.findFirst({
      where: {
        userId: user.id,
      },
    });

    const res =
      profile && profile.id
        ? await prisma.resume.create({
            data: {
              profileId: profile!.id,
              title,
              FileId: fileName
                ? await createFileEntry(fileName, filePath)
                : null,
            },
          })
        : await prisma.profile.create({
            data: {
              userId: user.id,
              resumes: {
                create: [
                  {
                    title,
                    FileId: fileName
                      ? await createFileEntry(fileName, filePath)
                      : null,
                  },
                ],
              },
            },
          });
    // revalidatePath("/dashboard/myjobs", "page");
    return { success: true, data: res };
  } catch (error) {
    const msg = "Failed to create resume.";
    return handleError(error, msg);
  }
};

const createFileEntry = async (
  fileName: string | undefined,
  filePath: string | undefined
) => {
  const newFileEntry = await prisma.file.create({
    data: {
      fileName: fileName!,
      filePath: filePath!,
      fileType: "resume",
    },
  });
  return newFileEntry.id;
};

export const editResume = async (
  id: string,
  title: string,
  fileId?: string,
  fileName?: string,
  filePath?: string
): Promise<any | undefined> => {
  try {
    let resolvedFileId = fileId;

    if (!fileId && fileName && filePath) {
      resolvedFileId = await createFileEntry(fileName, filePath);
    }

    if (resolvedFileId) {
      const isValidFileId = await prisma.file.findFirst({
        where: { id: resolvedFileId },
      });

      if (!isValidFileId) {
        throw new Error(
          `The provided FileId "${resolvedFileId}" does not exist.`
        );
      }
    }

    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const res = await prisma.resume.update({
      where: { id, profile: { userId: user.id } },
      data: {
        title,
        FileId: resolvedFileId || null,
      },
    });
    return { success: true, data: res };
  } catch (error) {
    const msg = "Failed to update resume or file.";
    return handleError(error, msg);
  }
};

export const deleteResumeById = async (
  resumeId: string,
  fileId?: string
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    if (fileId) {
      await deleteFile(fileId);
    }

    await prisma.$transaction(async (prisma) => {
      await prisma.contactInfo.deleteMany({
        where: {
          resumeId: resumeId,
        },
      });

      await prisma.summary.deleteMany({
        where: {
          ResumeSection: {
            resumeId: resumeId,
          },
        },
      });

      await prisma.workExperience.deleteMany({
        where: {
          ResumeSection: {
            resumeId: resumeId,
          },
        },
      });

      await prisma.education.deleteMany({
        where: {
          ResumeSection: {
            resumeId: resumeId,
          },
        },
      });

      await prisma.resumeSection.deleteMany({
        where: {
          resumeId: resumeId,
        },
      });

      await prisma.resume.delete({
        where: { id: resumeId },
      });
    });
    return { success: true };
  } catch (error) {
    const msg = "Failed to delete resume.";
    return handleError(error, msg);
  }
};

export const uploadFile = async (file: File, dir: string, path: string) => {
  const bytes = await file.arrayBuffer();
  const buffer = new Uint8Array(bytes);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await writeFile(path, buffer);
};

export const deleteFile = async (fileId: string) => {
  try {
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
      },
    });

    const filePath = file?.filePath as string;

    const fullFilePath = path.join(filePath);
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }
    fs.unlinkSync(filePath);

    await prisma.file.delete({
      where: {
        id: fileId,
      },
    });

    console.log("file deleted successfully!");
  } catch (error) {
    const msg = "Failed to delete file.";
    return handleError(error, msg);
  }
};

export const addResumeSummary = async (
  data: z.infer<typeof AddSummarySectionFormSchema>
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    const res = await prisma.resumeSection.create({
      data: {
        resumeId: data.resumeId!,
        sectionTitle: data.sectionTitle!,
        sectionType: SectionType.SUMMARY,
      },
    });

    const summary = await prisma.resumeSection.update({
      where: {
        id: res.id,
      },
      data: {
        summary: {
          create: {
            content: data.content!,
          },
        },
      },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: summary, success: true };
  } catch (error) {
    const msg = "Failed to create summary.";
    return handleError(error, msg);
  }
};

export const updateResumeSummary = async (
  data: z.infer<typeof AddSummarySectionFormSchema>
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    const res = await prisma.resumeSection.update({
      where: {
        id: data.id,
        Resume: { profile: { userId: user.id } },
      },
      data: {
        sectionTitle: data.sectionTitle!,
      },
    });

    const summary = await prisma.resumeSection.update({
      where: {
        id: data.id,
        Resume: { profile: { userId: user.id } },
      },
      data: {
        summary: {
          update: {
            content: data.content!,
          },
        },
      },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: summary, success: true };
  } catch (error) {
    const msg = "Failed to update summary.";
    return handleError(error, msg);
  }
};

export const addExperience = async (
  data: z.infer<typeof AddExperienceFormSchema>
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    if (!data.sectionId && !data.sectionTitle) {
      throw new Error("SectionTitle is required.");
    }

    const section = !data.sectionId
      ? await prisma.resumeSection.create({
          data: {
            resumeId: data.resumeId!,
            sectionTitle: data.sectionTitle!,
            sectionType: SectionType.EXPERIENCE,
          },
        })
      : undefined;

    const experience = await prisma.resumeSection.update({
      where: {
        id: section ? section.id : data.sectionId,
      },
      data: {
        workExperiences: {
          create: {
            jobTitleId: data.title,
            companyId: data.company,
            locationId: data.location,
            startDate: data.startDate,
            endDate: data.endDate,
            description: data.jobDescription,
          },
        },
      },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: experience, success: true };
  } catch (error) {
    const msg = "Failed to create experience.";
    return handleError(error, msg);
  }
};

export const updateExperience = async (
  data: z.infer<typeof AddExperienceFormSchema>
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    // const res = await prisma.resumeSection.update({
    //   where: {
    //     id: data.id,
    //   },
    //   data: {
    //     sectionTitle: data.sectionTitle!,
    //   },
    // });

    const summary = await prisma.workExperience.update({
      where: {
        id: data.id,
        ResumeSection: { Resume: { profile: { userId: user.id } } },
      },
      data: {
        jobTitleId: data.title,
        companyId: data.company,
        locationId: data.location,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.jobDescription,
      },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: summary, success: true };
  } catch (error) {
    const msg = "Failed to update experience.";
    return handleError(error, msg);
  }
};

export const addEducation = async (
  data: z.infer<typeof AddEducationFormSchema>
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    const section = !data.sectionId
      ? await prisma.resumeSection.create({
          data: {
            resumeId: data.resumeId!,
            sectionTitle: data.sectionTitle!,
            sectionType: SectionType.EDUCATION,
          },
        })
      : undefined;

    const education = await prisma.resumeSection.update({
      where: {
        id: section ? section.id : data.sectionId,
      },
      data: {
        educations: {
          create: {
            institution: data.institution,
            degree: data.degree,
            fieldOfStudy: data.fieldOfStudy,
            locationId: data.location,
            startDate: data.startDate,
            endDate: data.endDate,
            description: data.description,
          },
        },
      },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: education, success: true };
  } catch (error) {
    const msg = "Failed to create education.";
    return handleError(error, msg);
  }
};

function parseDateString(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;
  const parts = dateStr.split("/");
  if (parts.length === 2) {
    const month = parseInt(parts[0], 10) - 1;
    const year = parseInt(parts[1], 10);
    if (!isNaN(month) && !isNaN(year)) return new Date(year, month, 1);
  }
  const year = parseInt(dateStr, 10);
  if (!isNaN(year)) return new Date(year, 0, 1);
  return undefined;
}

export const applyParsedResume = async (
  resumeId: string,
  parsed: ResumeParseResponse,
): Promise<{ success: boolean; filled: string[]; error?: string }> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId, profile: { userId: user.id } },
      include: {
        ContactInfo: true,
        ResumeSections: {
          include: {
            workExperiences: true,
            educations: true,
          },
        },
      },
    });

    if (!resume) throw new Error("Resume not found");

    const filled: string[] = [];

    // Contact Info — skip if already exists
    if (!resume.ContactInfo && parsed.contact.firstName) {
      await prisma.contactInfo.create({
        data: {
          resumeId,
          firstName: parsed.contact.firstName,
          lastName: parsed.contact.lastName,
          headline: parsed.contact.headline ?? "",
          email: parsed.contact.email ?? "",
          phone: parsed.contact.phone ?? "",
          address: parsed.contact.address ?? null,
        },
      });
      filled.push("Contact Info");
    }

    // Summary — skip if section already exists
    const hasSummary = resume.ResumeSections.some(
      (s) => s.sectionType === SectionType.SUMMARY,
    );
    if (!hasSummary && parsed.summary) {
      const section = await prisma.resumeSection.create({
        data: { resumeId, sectionTitle: "Summary", sectionType: SectionType.SUMMARY },
      });
      await prisma.resumeSection.update({
        where: { id: section.id },
        data: { summary: { create: { content: parsed.summary } } },
      });
      filled.push("Summary");
    }

    // Experience — skip if section already has entries
    const expSection = resume.ResumeSections.find(
      (s) => s.sectionType === SectionType.EXPERIENCE,
    );
    const hasExperience = expSection && expSection.workExperiences.length > 0;
    if (!hasExperience && parsed.experiences.length > 0) {
      const section = expSection ?? (await prisma.resumeSection.create({
        data: { resumeId, sectionTitle: "Experience", sectionType: SectionType.EXPERIENCE },
      }));

      for (const exp of parsed.experiences) {
        const companyValue = exp.company.toLowerCase().trim();
        const jobTitleValue = exp.jobTitle.toLowerCase().trim();
        const locationValue = (exp.location ?? "").toLowerCase().trim() || "unknown";

        const [company, jobTitle, location] = await Promise.all([
          prisma.company.upsert({
            where: { value_createdBy: { value: companyValue, createdBy: user.id } },
            update: {},
            create: { label: exp.company, value: companyValue, createdBy: user.id },
          }),
          prisma.jobTitle.upsert({
            where: { value_createdBy: { value: jobTitleValue, createdBy: user.id } },
            update: {},
            create: { label: exp.jobTitle, value: jobTitleValue, createdBy: user.id },
          }),
          prisma.location.upsert({
            where: { value_createdBy: { value: locationValue, createdBy: user.id } },
            update: {},
            create: { label: exp.location ?? "Unknown", value: locationValue, createdBy: user.id },
          }),
        ]);

        const startDate = parseDateString(exp.startDate) ?? new Date();
        const endDate = exp.currentJob ? null : parseDateString(exp.endDate) ?? null;

        await prisma.resumeSection.update({
          where: { id: section.id },
          data: {
            workExperiences: {
              create: {
                companyId: company.id,
                jobTitleId: jobTitle.id,
                locationId: location.id,
                startDate,
                endDate,
                description: exp.description ?? "",
              },
            },
          },
        });
      }
      filled.push("Experience");
    }

    // Education — skip if section already has entries
    const eduSection = resume.ResumeSections.find(
      (s) => s.sectionType === SectionType.EDUCATION,
    );
    const hasEducation = eduSection && eduSection.educations.length > 0;
    if (!hasEducation && parsed.educations.length > 0) {
      const section = eduSection ?? (await prisma.resumeSection.create({
        data: { resumeId, sectionTitle: "Education", sectionType: SectionType.EDUCATION },
      }));

      for (const edu of parsed.educations) {
        const locationValue = (edu.location ?? "").toLowerCase().trim() || "unknown";

        const location = await prisma.location.upsert({
          where: { value_createdBy: { value: locationValue, createdBy: user.id } },
          update: {},
          create: { label: edu.location ?? "Unknown", value: locationValue, createdBy: user.id },
        });

        await prisma.resumeSection.update({
          where: { id: section.id },
          data: {
            educations: {
              create: {
                institution: edu.institution,
                degree: edu.degree ?? "",
                fieldOfStudy: edu.fieldOfStudy ?? "",
                locationId: location.id,
                startDate: parseDateString(edu.startDate) ?? new Date(),
                endDate: parseDateString(edu.endDate) ?? null,
                description: edu.description ?? null,
              },
            },
          },
        });
      }
      filled.push("Education");
    }

    revalidatePath(`/dashboard/profile/resume/${resumeId}`);
    return { success: true, filled };
  } catch (error) {
    const msg = "Failed to apply parsed resume.";
    console.error(msg, error);
    const message = error instanceof Error ? error.message : msg;
    return { success: false, filled: [], error: message };
  }
};

export const updateEducation = async (
  data: z.infer<typeof AddEducationFormSchema>
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    // const res = await prisma.resumeSection.update({
    //   where: {
    //     id: data.id,
    //   },
    //   data: {
    //     sectionTitle: data.sectionTitle!,
    //   },
    // });

    const summary = await prisma.education.update({
      where: {
        id: data.id,
        ResumeSection: { Resume: { profile: { userId: user.id } } },
      },
      data: {
        institution: data.institution,
        degree: data.degree,
        fieldOfStudy: data.fieldOfStudy,
        locationId: data.location,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description,
      },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: summary, success: true };
  } catch (error) {
    const msg = "Failed to update education.";
    return handleError(error, msg);
  }
};
