export * from "./bot";


export interface Match {
    _id: string;
    blue_team_id: string;
    red_team_id: string;
    blue_team_code_id?: string;
    red_team_code_id?: string;
    match_status: "Waiting" | "Queuing" | "Running" | "Finished";
}