// Client-side entry point for Server Actions: same names, but a failed action
// throws an Error carrying the real message (see lib/actions/result.ts), so
// forms can keep using try/catch + toast. Client components import actions
// from here; signOut (used as a <form action>) is imported directly.
import { unwrapActionResult, type ActionResult } from "@/lib/actions/result";
import * as ad_links from "@/lib/actions/admin/ad-links";
import * as blog from "@/lib/actions/admin/blog";
import * as competitions from "@/lib/actions/admin/competitions";
import * as config from "@/lib/actions/admin/config";
import * as content from "@/lib/actions/admin/content";
import * as custom_pages from "@/lib/actions/admin/custom-pages";
import * as fixture_lookup from "@/lib/actions/admin/fixture-lookup";
import * as predictions from "@/lib/actions/admin/predictions";
import * as sync_predictions from "@/lib/actions/admin/sync-predictions";
import * as users from "@/lib/actions/admin/users";
import * as settings from "@/lib/actions/settings";
import * as chat from "@/lib/actions/chat";
import * as notifications from "@/lib/actions/notifications";

function unwrapped<A extends unknown[], T>(action: (...args: A) => Promise<ActionResult<T>>) {
  return async (...args: A): Promise<T> => unwrapActionResult(await action(...args));
}

export const createAdLink = unwrapped(ad_links.createAdLink);
export const deleteAdLink = unwrapped(ad_links.deleteAdLink);
export const toggleAdLinkActive = unwrapped(ad_links.toggleAdLinkActive);
export const createBlogPost = unwrapped(blog.createBlogPost);
export const updateBlogPost = unwrapped(blog.updateBlogPost);
export const deleteBlogPost = unwrapped(blog.deleteBlogPost);
export const createCompetition = unwrapped(competitions.createCompetition);
export const updateCompetition = unwrapped(competitions.updateCompetition);
export const deleteCompetition = unwrapped(competitions.deleteCompetition);
export const saveSiteConfig = unwrapped(config.saveSiteConfig);
export const saveSiteContent = unwrapped(content.saveSiteContent);
export const createCustomPage = unwrapped(custom_pages.createCustomPage);
export const updateCustomPage = unwrapped(custom_pages.updateCustomPage);
export const deleteCustomPage = unwrapped(custom_pages.deleteCustomPage);
export const searchFixturesForDate = unwrapped(fixture_lookup.searchFixturesForDate);
export const getFixturePickOptions = unwrapped(fixture_lookup.getFixturePickOptions);
export const createPrediction = unwrapped(predictions.createPrediction);
export const updatePrediction = unwrapped(predictions.updatePrediction);
export const setPredictionResult = unwrapped(predictions.setPredictionResult);
export const approveResults = unwrapped(predictions.approveResults);
export const unapproveResults = unwrapped(predictions.unapproveResults);
export const regradeFromScores = unwrapped(predictions.regradeFromScores);
export const deletePredictions = unwrapped(predictions.deletePredictions);
export const runAutoSyncNow = unwrapped(predictions.runAutoSyncNow);
export const runScoreUpdateNow = unwrapped(predictions.runScoreUpdateNow);
export const syncPredictionsFromApi = unwrapped(sync_predictions.syncPredictionsFromApi);
export const toggleUserAdmin = unwrapped(users.toggleUserAdmin);
export const updateProfile = unwrapped(settings.updateProfile);
export const sendMessage = unwrapped(chat.sendMessage);
export const markConversationRead = unwrapped(chat.markConversationRead);
export const markNotificationRead = unwrapped(notifications.markNotificationRead);
export const markAllNotificationsRead = unwrapped(notifications.markAllNotificationsRead);
