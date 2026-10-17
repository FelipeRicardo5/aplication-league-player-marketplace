import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { MatchesService } from './matches.service';
import { ParsePositiveIntPipe } from '../core/pipes/parse-positive-int.pipe';
import { ZodValidationPipe } from '../core/pipes/zod-validation.pipe';
import { CreateMatchDto, createMatchSchema } from './dto/create-match.dto';
import { QueryMatchesDto, queryMatchesSchema } from './dto/query-matches.dto';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createMatch(
    @Body(new ZodValidationPipe(createMatchSchema)) dto: CreateMatchDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const match = await this.matchesService.createMatch(dto);
    res.setHeader('Location', `/api/v1/matches/${match.id}`);
    return match;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAllMatches(@Query(new ZodValidationPipe(queryMatchesSchema)) query: QueryMatchesDto) {
    return this.matchesService.findAllMatches(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findMatchById(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.matchesService.findMatchById(id);
  }
}
