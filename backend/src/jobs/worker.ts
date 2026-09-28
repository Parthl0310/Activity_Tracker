import { Activity } from '../models/Activity.js';
import { enrichActivity, embed, upsertVector } from '@activity-tracker/ai';

export async function enrichmentProcessor(data: { activityId: string; userId: string }) {
  const { activityId, userId } = data;

  const activity = await Activity.findOne({ _id: activityId, userId });
  if (!activity) {
    throw new Error(`Activity ${activityId} not found`);
  }

  // 1. Enrich with Gemini AI
  try {
    const enriched = await enrichActivity(
      userId.toString(),
      activityId.toString(),
      activity.text
    );

    if (enriched.skills && enriched.skills.length > 0) activity.skills = enriched.skills;
    if (enriched.keywords && enriched.keywords.length > 0) activity.keywords = enriched.keywords;
    if (enriched.aiRefinedText) activity.aiRefinedText = enriched.aiRefinedText;
    if (enriched.category) activity.category = enriched.category;
    if (enriched.workType) activity.workType = enriched.workType;
    if (!activity.project && enriched.project) activity.project = enriched.project;
    activity.enrichmentStatus = 'done';

    await activity.save();
    console.log(`[AI] Activity ${activityId} enriched ✅`);
  } catch (e: any) {
    activity.enrichmentStatus = 'failed';
    await activity.save();
    console.error(`[AI] Enrichment failed for ${activityId}:`, e.message);
    throw e;
  }

  // 2. Embed & Index in Pinecone
  const embedText = `Project: ${activity.project || 'None'}\nCategory: ${activity.category || 'None'}\nText: ${activity.aiRefinedText || activity.text}\nSkills: ${(activity.skills || []).join(', ')}`;

  try {
    const vector = await embed(embedText);
    await upsertVector('activities', activity._id.toString(), vector, {
      userId: userId.toString(),
      activityId: activity._id.toString(),
      text: activity.aiRefinedText || activity.text,
      workDate: activity.workDate.toISOString(),
      project: activity.project || '',
      category: activity.category || '',
      skills: (activity.skills || []).slice(0, 15),
      workType: activity.workType || '',
    });

    activity.vectorIndexed = true;
    await activity.save();
    console.log(`[AI] Activity ${activityId} indexed in Pinecone ✅`);
  } catch (e: any) {
    console.warn(`[AI] Pinecone indexing failed for ${activityId}:`, e.message);
    // Don't rethrow — MongoDB save already succeeded
  }
}
