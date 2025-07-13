import { createOpenAI } from "@ai-sdk/openai"
import { generateObject, type CoreUserMessage } from "ai"
import { z } from "zod"

const playerStatSchema = z.object({
  playerName: z.string().describe("The full name of the player."),
  stats: z.object({
    PA: z.number().describe("Plate Appearances"),
    AB: z.number().describe("At Bats"),
    R: z.number().describe("Runs Scored"),
    H: z.number().describe("Hits"),
    "1B": z.number().describe("Singles"),
    "2B": z.number().describe("Doubles"),
    "3B": z.number().describe("Triples"),
    HR: z.number().describe("Home Runs"),
    RBI: z.number().describe("Runs Batted In"),
    BB: z.number().describe("Walks (Bases on Balls)"),
    SO: z.number().describe("Strikeouts"),
    HBP: z.number().describe("Hit by Pitch"),
    SF: z.number().describe("Sacrifice Flies"),
    SAC: z.number().describe("Sacrifice Bunts/Hits"),
  }),
})

const scorebookSchema = z.object({
  players: z.array(playerStatSchema),
})

export type PlayerStatData = z.infer<typeof playerStatSchema>

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function processScorebookImage(mediaUrl: string): Promise<PlayerStatData[]> {
  console.log(`Processing image with AI from: ${mediaUrl}`)

  try {
    const userMessage: CoreUserMessage = {
      role: "user",
      content: [
        {
          type: "text",
          text: "Here are three example scorebooks that show the visual patterns you should recognize. Study these carefully to understand how markings translate to statistics:",
        },
        {
          type: "text",
          text: "EXAMPLE GAME 1 - This scorebook shows the following statistics by row:",
        },
        {
          type: "image",
          image: new URL("https://blob.v0.dev/OYcoA.jpeg"),
        },
        {
          type: "text",
          text: "Row 1: 4 PA, 4 AB, 1 H, 1 R, 0 BB | Row 2: 4 PA, 4 AB, 2 H, 2 R, 0 BB | Row 3: 4 PA, 4 AB, 3 H, 1 3B, 2 R, 0 BB | Row 4: 4 PA, 4 AB, 3 H, 1 R, 0 BB | Row 5: 4 PA, 4 AB, 1 H, 0 R, 0 BB | Row 6: 4 PA, 4 AB, 3 H, 2 R, 0 BB | Row 7: 4 PA, 4 AB, 4 H, 0 R, 0 BB | Row 8: 4 PA, 4 AB, 2 H, 0 R, 0 BB | Row 9: 4 PA, 4 AB, 2 H, 1 2B, 0 R, 0 BB | Row 10: 3 PA, 3 AB, 3 H, 1 2B, 1 R, 0 BB",
        },
        {
          type: "text",
          text: "EXAMPLE GAME 2 - This scorebook shows the following statistics by row:",
        },
        {
          type: "image",
          image: new URL("https://blob.v0.dev/2WIgt.jpeg"),
        },
        {
          type: "text",
          text: "Row 1: 5 PA, 4 AB, 4 H, 1 2B, 3 R, 1 BB | Row 2: 5 PA, 5 AB, 4 H, 3 2B, 2 R, 0 BB | Row 3: 5 PA, 4 AB, 2 H, 0 R, 1 BB | Row 4: 4 PA, 3 AB, 1 H, 1 SAC, 1 R, 0 BB | Row 5: 4 PA, 4 AB, 2 H, 1 2B, 1 R, 0 BB | Row 6: 4 PA, 4 AB, 2 H, 1 R, 0 BB | Row 7: 4 PA, 4 AB, 2 H, 0 R, 0 BB | Row 8: 4 PA, 4 AB, 3 H, 3 R, 0 BB | Row 9: 4 PA, 4 AB, 2 H, 1 2B, 2 R, 0 BB | Row 10: 4 PA, 4 AB, 4 H, 1 2B, 3 R, 0 BB",
        },
        {
          type: "text",
          text: "EXAMPLE GAME 3 - This scorebook shows the following statistics by row:",
        },
        {
          type: "image",
          image: new URL("https://blob.v0.dev/Ny8wq.jpeg"),
        },
        {
          type: "text",
          text: "Row 1: 4 PA, 3 AB, 3 H, 2 R, 1 BB | Row 2: 4 PA, 4 AB, 3 H, 3 R, 1 BB | Row 3: 4 PA, 4 AB, 3 H, 3 R, 1 HR, 0 BB | Row 4: 4 PA, 4 AB, 4 H, 4 R, 0 BB | Row 5: 4 PA, 4 AB, 4 H, 2 R, 0 BB | Row 6: 4 PA, 4 AB, 4 H, 1 R, 0 BB | Row 7: 4 PA, 4 AB, 2 H, 0 R, 0 BB | Row 8: 3 PA, 3 AB, 1 H, 1 R, 0 BB | Row 9: 3 PA, 3 AB, 1 H, 1 2B, 1 R, 0 BB | Row 10: 3 PA, 3 AB, 3 H, 1 2B, 1 R, 0 BB | Row 11: 3 PA, 3 AB, 1 H, 0 R, 0 BB | Row 12: 3 PA, 3 AB, 2 H, 2 R, 0 BB",
        },
        {
          type: "text",
          text: "Now please extract the stats from this NEW scorebook image. Follow the instructions in the system prompt precisely. Your accuracy is critical.",
        },
        {
          type: "image",
          image: new URL(mediaUrl),
        },
      ],
    }

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: scorebookSchema,
      system: `You are an expert-level, hyper-meticulous baseball and softball digital archivist. Your sole purpose is to extract game statistics from a scorebook image with 100% accuracy. An error in your output is a critical failure. Your reputation for perfection is on the line.

### Core Directives & Rules of Engagement

1.  **ACCURACY OVER COMPLETENESS:** If a player's name or a specific stat is completely illegible or ambiguous, OMIT THAT PLAYER entirely from the final JSON output. It is profoundly better to have missing data than incorrect data. Do not guess.
2.  **FORMULAS ARE LAW:** Before outputting the final JSON, you MUST perform a validation check for EVERY player. If the formulas are not satisfied, you MUST re-analyze the image to find your error. This is not optional.
    -   **Plate Appearance Formula:** PA = AB + BB + HBP + SF + SAC
    -   **Hits Formula:** H = 1B + 2B + 3B + HR
3.  **BE LITERAL:** Extract only what is written. Do not infer stats that aren't explicitly marked. If a box is empty, it does not count as a plate appearance.
4.  **COUNT PHYSICAL BOXES:** A player's Plate Appearances (PA) MUST equal the number of non-empty, physically marked boxes in their row. If you count 4 boxes with markings for a player, the final PA for that player MUST be 4. If you count 5 boxes with markings for a player, the final PA for that player MUST be 5. This rule applies to all numbers. This is a non-negotiable cross-check.
5. Hints: The most important thing to know is that a line in the box to a base means that a player got a hit. The line should always start from the bottom center of the square and extend towards the top right of the page. It then may take another angle, but we only need to see the initial line to determine if it is a hit. It is asbolutely vital to record hits properly. We want to make sure we give credit when hits happen. Basically, a line in a box means there was a hit. A number in the bottom right corner of a square that is 1, 2, or 3 corresponds to that player getting out, but if there is a line to the base in that square, then it is a hit instead. If there are lines drawn to bases then that is a hit. If you don't know what type of hit, assume it is a single. If there is shading in the square to fill the diamond then it is a run. It does not need to be completely filled, only mostly. If there is nothing in a square then it is nothing. If you look within a square at the top, you can see printed numbers. If one of those is circled or it looks like someone tried to circle it, that corresponds to the type of hit the player got which could be a single, double, triple, or home run. If you look in the bottom left, you can see symbols for BB which is a walk if circled, HP which is HPB if circled, and Sac which is a sac if circled. Also when extracting names, do your best to use names that make sense if you are unsure what the name is. If it looks short and is hard to tell what it is, then it is probably initials. 

### Scorebook Layout & Structure

*   **Rows are Players:** Each horizontal row on the scorebook corresponds to a single player for the entire game.
*   **Columns are Innings:** Each vertical column represents an inning. You will typically see columns labeled 1, 2, 3, 4, 5, 6, 7, etc.
*   **Processing Flow:** Your primary scanning direction should be **horizontal**. For a given player (a row), you will scan from left to right across the inning columns to find all of their plate appearances. **Do not confuse the number of innings with the number of plate appearances.**

### Symbol-to-Stat Mapping Table

| Symbol(s)                               | Stat Category | Notes                                                              |
| :-------------------------------------- | :------------ | :----------------------------------------------------------------- |
| 1B, S, or a single line to first | 1B        | Counts as H, AB, PA.                                               |
| 2B, D                            | 2B        | Counts as H, AB, PA.                                               |
| 3B, T                            | 3B        | Counts as H, AB, PA.                                               |
| HR                                  | HR        | Counts as H, AB, PA.                                               |
| BB                                  | BB        | Counts as PA. **Does NOT count as AB.**                            |
| HBP                                 | HBP       | Counts as PA. **Does NOT count as AB.**                            |
| K, ꓘ (backwards K)               | SO        | Counts as AB, PA.                                                  |
| SF                                  | SF        | Counts as PA. **Does NOT count as AB.**                            |
| SAC, SH                         | SAC       | Counts as PA. **Does NOT count as AB.**                            |
| E + number (e.g., E6)               | AB, PA  | An out on an error. Counts as AB, PA. **Does NOT count as H.**     |
| FC                                  | AB, PA  | Fielder's Choice. Counts as AB, PA. **Does NOT count as H.**       |
| Colored-in diamond                      | R         | A run was scored by that player.                                   |
| Number inside diamond (e.g., ②)         | RBI       | The number of Runs Batted In on that play.                         |

### Your Step-by-Step Internal Process (MANDATORY)

You will perform the following steps internally. Do not output this process in the final JSON.

1.  **Initial Scan & Player Identification:** Scan the image and list all clearly legible player names from the player rows.
2.  **Box-by-Box Tally (Internal Scratchpad):** For each identified player row, scan horizontally from left to right across the inning columns. For each non-empty box, note the outcome.
    *   *Example Scratchpad Entry:* "Player 'Jane Doe', Inning 1: 2B, R, RBI: 2. This is 1 PA, 1 AB, 1 H, 1 2B, 1 R, 2 RBI."
3.  **Aggregate Stats (Internal Scratchpad):** After tallying all boxes for a player, sum up the stats into the final categories.
    *   *Example Aggregation:* "Player 'Jane Doe' Totals: PA: 4, AB: 3, H: 1, 2B: 1, R: 1, RBI: 2, BB: 1, SO: 0, HBP: 0, SF: 0, SAC: 0."
4.  **MANDATORY VALIDATION (Self-Correction):** For each player, check your aggregated stats against the Core Directive formulas.
    *   *Example Validation:* "Validation for Jane Doe: PA(4) = AB(3) + BB(1) + HBP(0) + SF(0) + SAC(0) -> 4 = 4. Correct. H(1) = 1B(0) + 2B(1) + 3B(0) + HR(0) -> 1 = 1. Correct. Proceeding."
    *   If validation fails, you MUST state the failure and go back to Step 2 to re-tally for that player.
5.  **Final JSON Generation:** Only after successfully validating ALL players, construct the final, clean JSON object according to the provided Zod schema. Ensure all stat fields are present (defaulting to 0 if no value was tallied).`,
      messages: [userMessage],
    })

    console.log("AI processing complete. Extracted stats for:", object.players.length, "players.")
    return object.players
  } catch (error) {
    console.error("Error processing image with AI:", error)
    throw new Error("The AI model could not process the scorebook image. Please ensure it's clear and legible.")
  }
}

export const processImage = processScorebookImage
