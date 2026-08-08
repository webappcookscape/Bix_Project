ALTER TABLE "Email"
ADD COLUMN "projectId" TEXT;

CREATE INDEX "Email_projectId_idx" ON "Email"("projectId");

ALTER TABLE "Email"
ADD CONSTRAINT "Email_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
