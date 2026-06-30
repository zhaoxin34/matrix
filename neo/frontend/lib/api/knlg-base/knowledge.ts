/**
 * Knowledge Base API client.
 */

import {
	knlgBasePath,
	knlgDelete,
	knlgGet,
	knlgPost,
	knlgPut,
	type KnowledgeCard,
	type KnowledgeCardCreate,
	type KnowledgeCardListResponse,
	type KnowledgeCardUpdate,
	type SourceRef,
} from "./_base";

const path = (ws: string, suffix = "") =>
	knlgBasePath(ws, `/knowledge${suffix}`);

export async function listKnowledgeCards(
	workspaceCode: string,
	params?: {
		page?: number;
		page_size?: number;
		domain?: string;
		type?: string;
		status?: string;
		validation_status?: string;
		keyword?: string;
	},
): Promise<KnowledgeCardListResponse> {
	const search = new URLSearchParams();
	if (params) {
		Object.entries(params).forEach(([k, v]) => {
			if (v !== undefined && v !== null) search.append(k, String(v));
		});
	}
	const qs = search.toString();
	return knlgGet<KnowledgeCardListResponse>(
		path(workspaceCode, qs ? `?${qs}` : ""),
	);
}

export async function getKnowledgeCard(
	workspaceCode: string,
	id: number,
): Promise<KnowledgeCard> {
	return knlgGet<KnowledgeCard>(path(workspaceCode, `/cards/${id}`));
}

export async function createKnowledgeCard(
	workspaceCode: string,
	data: KnowledgeCardCreate,
): Promise<KnowledgeCard> {
	return knlgPost<KnowledgeCard>(path(workspaceCode), data);
}

export async function updateKnowledgeCard(
	workspaceCode: string,
	id: number,
	data: KnowledgeCardUpdate,
): Promise<KnowledgeCard> {
	return knlgPut<KnowledgeCard>(path(workspaceCode, `/cards/${id}`), data);
}

export async function deleteKnowledgeCard(
	workspaceCode: string,
	id: number,
): Promise<null> {
	return knlgDelete<null>(path(workspaceCode, `/cards/${id}`));
}

export async function publishKnowledgeCard(
	workspaceCode: string,
	id: number,
): Promise<KnowledgeCard> {
	return knlgPost<KnowledgeCard>(path(workspaceCode, `/cards/${id}/publish`));
}

export async function deprecateKnowledgeCard(
	workspaceCode: string,
	id: number,
): Promise<KnowledgeCard> {
	return knlgPost<KnowledgeCard>(path(workspaceCode, `/cards/${id}/deprecate`));
}

export async function listKnowledgeCardVersions(
	workspaceCode: string,
	id: number,
): Promise<KnowledgeCardListResponse> {
	return knlgGet<KnowledgeCardListResponse>(
		path(workspaceCode, `/cards/${id}/versions`),
	);
}

export async function listKnowledgeCardSources(
	workspaceCode: string,
	id: number,
): Promise<SourceRef[]> {
	return knlgGet<SourceRef[]>(path(workspaceCode, `/cards/${id}/sources`));
}
