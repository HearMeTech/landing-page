import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { defineSecret, defineString } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';

const REGION = 'europe-west4';
const MAX_INSTANCES = 5;
const WEBHOOK_TIMEOUT_MS = 8000;

// Secret token shared with the Cloudflare Worker admin notifier (`NOTIFY_SECRET`)
const notifySecret = defineSecret('NOTIFY_SECRET');

// Configurable webhook URL (injected via functions/.env.<project-id>)
const workerNotifyUrl = defineString('WORKER_NOTIFY_URL');

/**
 * Safely normalizes an unknown Firestore field into a trimmed string or null.
 *
 * @param {unknown} value
 * @returns {string | null}
 */
function toNullableString(value) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

/**
 * Safely converts a Firestore Timestamp (or fallback value) into an ISO-8601 string.
 *
 * @param {any} timestamp
 * @returns {string}
 */
function toIsoTimestamp(timestamp) {
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toISOString();
    }
    return new Date().toISOString();
}

/**
 * Dispatches a structured JSON event payload to the Cloudflare Worker admin bot.
 * Enforces a strict timeout so transient downstream issues cannot stall function instances.
 *
 * @param {Record<string, unknown>} payload
 * @returns {Promise<void>}
 */
async function dispatchToWorker(payload) {
    const targetUrl = workerNotifyUrl.value().trim();
    const secretValue = notifySecret.value().trim();

    if (!targetUrl) {
        throw new Error('WORKER_NOTIFY_URL parameter is empty.');
    }

    if (!secretValue) {
        throw new Error('NOTIFY_SECRET is empty.');
    }

    const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': secretValue
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS)
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(
            `Worker notification failed with status ${response.status}: ${errText}`
        );
    }
}

/**
 * Trigger 1: Fires whenever a new contact form submission is created
 * under `messages/{messageId}`.
 */
export const onNewContactMessage = onDocumentCreated(
    {
        document: 'messages/{messageId}',
        region: REGION,
        maxInstances: MAX_INSTANCES,
        secrets: [notifySecret]
    },
    async (event) => {
        const snap = event.data;
        if (!snap) {
            logger.warn('onNewContactMessage triggered without snapshot data', {
                messageId: event.params.messageId
            });
            return;
        }

        const doc = snap.data();
        const messageId = event.params.messageId;

        await dispatchToWorker({
            event: 'landing_contact',
            data: {
                messageId,
                name: toNullableString(doc.name) || 'Anonymous',
                email: toNullableString(doc.email),
                message: toNullableString(doc.message) || '',
                locale: toNullableString(doc.locale) || 'unknown',
                source: toNullableString(doc.source) || 'homepage_contact',
                pagePath: toNullableString(doc.pagePath),
                createdAt: toIsoTimestamp(doc.createdAt)
            }
        });

        logger.info('Landing contact notification dispatched', {
            messageId,
            locale: doc.locale || 'unknown'
        });
    }
);

/**
 * Trigger 2: Fires whenever a new waitlist signup is created
 * under `waitlist/{entryId}`.
 */
export const onNewWaitlistSignup = onDocumentCreated(
    {
        document: 'waitlist/{entryId}',
        region: REGION,
        maxInstances: MAX_INSTANCES,
        secrets: [notifySecret]
    },
    async (event) => {
        const snap = event.data;
        if (!snap) {
            logger.warn('onNewWaitlistSignup triggered without snapshot data', {
                entryId: event.params.entryId
            });
            return;
        }

        const doc = snap.data();
        const entryId = event.params.entryId;

        await dispatchToWorker({
            event: 'landing_waitlist',
            data: {
                entryId,
                name: toNullableString(doc.name),
                email: toNullableString(doc.email),
                comment: toNullableString(doc.comment),
                locale: toNullableString(doc.locale) || 'unknown',
                source: toNullableString(doc.source) || 'landing-page',
                pagePath: toNullableString(doc.pagePath),
                createdAt: toIsoTimestamp(doc.createdAt)
            }
        });

        logger.info('Landing waitlist notification dispatched', {
            entryId,
            locale: doc.locale || 'unknown'
        });
    }
);
