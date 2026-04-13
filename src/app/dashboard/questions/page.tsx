import type { Metadata } from "next";
import QuestionsPageClient from "./QuestionsPageClient";

export const metadata: Metadata = { title: "Question Bank" };
import { getTagsWithQuestionCounts } from "@/actions/question.actions";
import { getAllTags } from "@/actions/tag.actions";
import React from "react";

async function Questions() {
  const [allTags, tagsWithCounts] = await Promise.all([
    getAllTags(),
    getTagsWithQuestionCounts(),
  ]);

  return (
    <QuestionsPageClient
      allTags={allTags || []}
      tagsWithCounts={tagsWithCounts?.data || []}
      totalQuestions={tagsWithCounts?.totalQuestions || 0}
    />
  );
}

export default Questions;
