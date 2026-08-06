import fs from 'node:fs/promises';
import path from 'node:path';
import { ipcMain } from 'electron';

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  instruction: string;
}

interface PromptSkillHandlerPaths {
  storyboardPromptsPath: string;
  skillsPath: string;
}

export function registerPromptSkillHandlers(paths: PromptSkillHandlerPaths): void {
  ipcMain.handle('storyboardPrompts:read', async () => {
    const prompts = await readJson(paths.storyboardPromptsPath, {}, 'storyboard prompts');
    assertPrompts(prompts);
    return prompts;
  });
  ipcMain.handle('storyboardPrompts:save', async (_event, prompts: Record<string, string>) => {
    assertPrompts(prompts);
    await writeJson(paths.storyboardPromptsPath, prompts);
  });
  ipcMain.handle('skills:list', async () => {
    const skills = await readJson(paths.skillsPath, [], 'skills');
    assertSkills(skills);
    return skills;
  });
  ipcMain.handle('skills:save', async (_event, skills: SkillDefinition[]) => {
    assertSkills(skills);
    await writeJson(paths.skillsPath, skills);
  });
}

async function readJson(filePath: string, fallback: unknown, label: string): Promise<unknown> {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8')) as unknown;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return fallback;
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Unable to read ${label}: ${message}`);
  }
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function assertPrompts(prompts: unknown): asserts prompts is Record<string, string> {
  if (!prompts || typeof prompts !== 'object' || Array.isArray(prompts)
    || Object.values(prompts).some((prompt) => typeof prompt !== 'string')) {
    throw new Error('Invalid storyboard prompts');
  }
}

function assertSkills(skills: unknown): asserts skills is SkillDefinition[] {
  if (!Array.isArray(skills) || skills.some((skill) => !isSkillDefinition(skill))) {
    throw new Error('Invalid skills');
  }
}

function isSkillDefinition(value: unknown): value is SkillDefinition {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const skill = value as Record<string, unknown>;
  return typeof skill.id === 'string'
    && typeof skill.name === 'string'
    && typeof skill.description === 'string'
    && typeof skill.instruction === 'string';
}
