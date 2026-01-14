import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { code, language = 'python' } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    if (language !== 'python') {
      return NextResponse.json({ error: "Only Python is supported currently" }, { status: 400 });
    }

    // Create a temporary file to run the code
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'exam-run-'));
    const tempFile = path.join(tempDir, 'solution.py');
    await fs.writeFile(tempFile, code);

    try {
      // Run the code with a timeout
      const { stdout, stderr } = await execAsync(`python3 "${tempFile}"`, {
        timeout: 5000, // 5 seconds timeout
        maxBuffer: 1024 * 1024, // 1MB output limit
      });

      return NextResponse.json({
        success: true,
        stdout,
        stderr,
      });
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
      });
    } finally {
      // Cleanup
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error("Error running code:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
