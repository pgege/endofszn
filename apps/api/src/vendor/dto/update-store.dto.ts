import {
  IsString,
  IsOptional,
  IsUrl,
  IsEmail,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tagline?: string;

  @IsOptional()
  @IsUrl()
  logo_url?: string | null;

  @IsOptional()
  @IsUrl()
  banner_url?: string | null;

  @IsOptional()
  @IsEmail()
  contact_email?: string | null;

  @IsOptional()
  @IsString()
  contact_phone?: string | null;

  @IsOptional()
  @IsString()
  address_street?: string | null;

  @IsOptional()
  @IsString()
  address_city?: string | null;

  @IsOptional()
  @IsString()
  address_state?: string | null;

  @IsOptional()
  @IsString()
  address_country?: string | null;

  @IsOptional()
  @IsString()
  address_postal_code?: string | null;

  @IsOptional()
  @IsUrl()
  website_url?: string | null;

  @IsOptional()
  @IsString()
  instagram_url?: string | null;

  @IsOptional()
  @IsString()
  twitter_url?: string | null;

  @IsOptional()
  @IsString()
  facebook_url?: string | null;

  @IsOptional()
  @IsString()
  tiktok_url?: string | null;

  @IsOptional()
  @IsString()
  business_type?: string | null;

  @IsOptional()
  @IsString()
  tax_id?: string | null;

  @IsOptional()
  @IsString()
  registration_number?: string | null;

  @IsOptional()
  @IsBoolean()
  is_published?: boolean;

  @IsOptional()
  @IsBoolean()
  accepts_orders?: boolean;
}
