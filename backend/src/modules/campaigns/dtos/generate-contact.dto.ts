import { IsOptional, IsString } from 'class-validator';

export class GenerateContactDto {
  @IsOptional()
  @IsString()
  overrideTemplate?: string;
}
