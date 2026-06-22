import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  /** Must contain {{placeholders}} that map to contact fields. */
  @IsString()
  @IsNotEmpty()
  @Matches(/\{\{name\}\}/, { message: 'Prompt template must include at least the {{name}} placeholder.' })
  promptTemplate: string;
}
