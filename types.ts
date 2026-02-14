export type Context = {
	shell: string;
	os: string;
	packageManager: string | null;
	gitBranch: string | null;
	gitBranches: string[];
	gitDirty: boolean;
	cwd: string[];
	availableClis: string[];
};

export type RequestBody = {
	model: string;
	system: string;
	prompt: string;
	stream: boolean;
	options: { temperature: number; top_p: number; repeat_penalty: number };
};
