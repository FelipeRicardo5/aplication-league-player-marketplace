import { Body, Controller, Get, HttpStatus, Param, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ParsePositiveIntPipe } from '../core/pipes/parse-positive-int.pipe';
import { ZodValidationPipe } from '../core/pipes/zod-validation.pipe';
import { ClubDetailResponse, ClubSummaryResponse, ClubsService } from './clubs.service';
import { CreateClubDto, createClubSchema } from './dto/create-club.dto';
import { QueryClubsDto, queryClubsSchema } from './dto/query-clubs.dto';

@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(createClubSchema)) dto: CreateClubDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ClubSummaryResponse> {
    const club = await this.clubsService.create(dto);
    res.status(HttpStatus.CREATED);
    res.setHeader('Location', `/api/v1/clubs/${club.id}`);
    return club;
  }

  @Get()
  async findAll(
    @Query(new ZodValidationPipe(queryClubsSchema)) query: QueryClubsDto,
  ): Promise<ClubSummaryResponse[]> {
    return this.clubsService.findAll(query);
  }

  @Get(':id')
  async findById(@Param('id', ParsePositiveIntPipe) id: number): Promise<ClubDetailResponse> {
    return this.clubsService.findById(id);
  }
}
