/**
 * QA Library API client.
 */

import {
	knlgBasePath,
	knlgDelete,
	knlgGet,
	knlgPatch,
	knlgPost,
	knlgPut,
	type Interview,
	type InterviewSession,
	type InterviewTurn,
	type Question,
	type QuestionTree,
} from "./_base";

const path = (ws: string, suffix = "") => knlgBasePath(ws, `/qa${suffix}`);

// ==================== Question Tree ====================

export async function listQuestionTrees(
	workspaceCode: string,
	params?: {
		page?: number;
		page_size?: number;
		domain?: string;
		is_active?: boolean;
	},
): Promise<{
	items: QuestionTree[];
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
}> {
	const search = new URLSearchParams();
	if (params) {
		Object.entries(params).forEach(([k, v]) => {
			if (v !== undefined && v !== null) search.append(k, String(v));
		});
	}
	const qs = search.toString();
	return knlgGet(path(workspaceCode, `/question-trees${qs ? `?${qs}` : ""}`));
}

export async function createQuestionTree(
	workspaceCode: string,
	data: {
		name: string;
		domain: string;
		description?: string;
		questions: Array<{ id: string; text: string; followups?: string[] }>;
	},
): Promise<QuestionTree> {
	return knlgPost(path(workspaceCode, "/question-trees"), data);
}

export async function updateQuestionTree(
	workspaceCode: string,
	id: number,
	data: Partial<{
		name: string;
		domain: string;
		description: string;
		questions: unknown[];
		is_active: boolean;
	}>,
): Promise<QuestionTree> {
	return knlgPut(path(workspaceCode, `/question-trees/${id}`), data);
}

export async function deleteQuestionTree(
	workspaceCode: string,
	id: number,
): Promise<null> {
	return knlgDelete(path(workspaceCode, `/question-trees/${id}`));
}

// ==================== Question ====================

export async function listQuestions(
	workspaceCode: string,
	params?: {
		page?: number;
		page_size?: number;
		domain?: string;
		status?: string;
		tags?: string;
		keyword?: string;
		tree_id?: number;
	},
): Promise<{ items: Question[]; total: number }> {
	const search = new URLSearchParams();
	if (params) {
		Object.entries(params).forEach(([k, v]) => {
			if (v !== undefined && v !== null) search.append(k, String(v));
		});
	}
	const qs = search.toString();
	return knlgGet(path(workspaceCode, `/questions${qs ? `?${qs}` : ""}`));
}

export async function createQuestion(
	workspaceCode: string,
	data: {
		text: string;
		domain: string;
		tags?: string[];
		parent_question_id?: number;
		tree_id?: number;
		priority?: number;
	},
): Promise<Question> {
	return knlgPost(path(workspaceCode, "/questions"), data);
}

export async function updateQuestion(
	workspaceCode: string,
	id: number,
	data: Partial<{
		text: string;
		domain: string;
		tags: string[];
		tree_id: number;
		parent_question_id: number;
		priority: number;
	}>,
): Promise<Question> {
	return knlgPut(path(workspaceCode, `/questions/${id}`), data);
}

export async function archiveQuestion(
	workspaceCode: string,
	id: number,
): Promise<Question> {
	return knlgPatch(path(workspaceCode, `/questions/${id}/archive`), {});
}

export async function getQuestion(
	workspaceCode: string,
	id: number,
): Promise<Question> {
	return knlgGet(path(workspaceCode, `/questions/${id}`));
}

// ==================== Interview Session ====================

export async function listInterviewSessions(
	workspaceCode: string,
	params?: {
		page?: number;
		page_size?: number;
		expert_id?: number;
		mode?: string;
	},
): Promise<InterviewSession[]> {
	const search = new URLSearchParams();
	if (params) {
		Object.entries(params).forEach(([k, v]) => {
			if (v !== undefined && v !== null) search.append(k, String(v));
		});
	}
	const qs = search.toString();
	return knlgGet(path(workspaceCode, `/sessions${qs ? `?${qs}` : ""}`));
}

export async function createInterviewSession(
	workspaceCode: string,
	data: { expert_id: number; topic: string; mode?: string },
): Promise<InterviewSession> {
	return knlgPost(path(workspaceCode, "/sessions"), data);
}

export async function getInterviewSession(
	workspaceCode: string,
	id: number,
): Promise<InterviewSession> {
	return knlgGet(path(workspaceCode, `/sessions/${id}`));
}

export async function endInterviewSession(
	workspaceCode: string,
	id: number,
): Promise<InterviewSession> {
	return knlgPost(path(workspaceCode, `/sessions/${id}/end`), {});
}

// ==================== Interview ====================

export async function listInterviews(
	workspaceCode: string,
	params?: {
		page?: number;
		page_size?: number;
		session_id?: number;
		question_id?: number;
		expert_id?: number;
		mode?: string;
	},
): Promise<Interview[]> {
	const search = new URLSearchParams();
	if (params) {
		Object.entries(params).forEach(([k, v]) => {
			if (v !== undefined && v !== null) search.append(k, String(v));
		});
	}
	const qs = search.toString();
	return knlgGet(path(workspaceCode, `/interviews${qs ? `?${qs}` : ""}`));
}

export async function createInterview(
	workspaceCode: string,
	data: {
		session_id: number;
		question_id: number;
		expert_id: number;
		mode?: string;
	},
): Promise<Interview> {
	return knlgPost(path(workspaceCode, "/interviews"), data);
}

export async function getInterview(
	workspaceCode: string,
	id: number,
): Promise<Interview> {
	return knlgGet(path(workspaceCode, `/interviews/${id}`));
}

export async function endInterview(
	workspaceCode: string,
	id: number,
): Promise<Interview> {
	return knlgPost(path(workspaceCode, `/interviews/${id}/end`), {});
}

// ==================== Interview Turn ====================

export async function listTurns(
	workspaceCode: string,
	interviewId: number,
): Promise<InterviewTurn[]> {
	return knlgGet(path(workspaceCode, `/interviews/${interviewId}/turns`));
}

export async function addTurn(
	workspaceCode: string,
	interviewId: number,
	data: {
		question: string;
		answer: string;
		type?: string;
		confidence?: number;
		parent_turn_id?: number;
		tags?: string[];
		metadata?: Record<string, unknown>;
	},
): Promise<InterviewTurn> {
	return knlgPost(
		path(workspaceCode, `/interviews/${interviewId}/turns`),
		data,
	);
}

export async function updateTurn(
	workspaceCode: string,
	interviewId: number,
	turnId: number,
	data: Partial<{
		question: string;
		answer: string;
		type: string;
		confidence: number;
		tags: string[];
		metadata: Record<string, unknown>;
	}>,
): Promise<InterviewTurn> {
	return knlgPut(
		path(workspaceCode, `/interviews/${interviewId}/turns/${turnId}`),
		data,
	);
}

export async function deleteTurn(
	workspaceCode: string,
	interviewId: number,
	turnId: number,
): Promise<null> {
	return knlgDelete(
		path(workspaceCode, `/interviews/${interviewId}/turns/${turnId}`),
	);
}
