import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ParsePositiveIntPipe } from '../core/pipes/parse-positive-int.pipe';
import { ZodValidationPipe } from '../core/pipes/zod-validation.pipe';
import { CreatePlayerDto, createPlayerSchema } from './dto/create-player.dto';
import { QueryPlayersDto, queryPlayersSchema } from './dto/query-players.dto';
import { UpdateConditionDto, updateConditionSchema } from './dto/update-condition.dto';
import { UpdatePlayerDto, updatePlayerSchema } from './dto/update-player.dto';
import { PlayerResponse, PlayersService } from './players.service';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(createPlayerSchema)) dto: CreatePlayerDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PlayerResponse> {
    const player = await this.playersService.create(dto);
    res.status(HttpStatus.CREATED);
    res.setHeader('Location', `/api/v1/players/${player.id}`);
    return player;
  }

  @Get()
  async findAll(@Query(new ZodValidationPipe(queryPlayersSchema)) query: QueryPlayersDto): Promise<{
    data: PlayerResponse[];
    meta: { page: number; limit: number; total_items: number; total_pages: number };
  }> {
    return this.playersService.findAll(query);
  }

  @Get(':id')
  async findById(@Param('id', ParsePositiveIntPipe) id: number): Promise<PlayerResponse> {
    return this.playersService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParsePositiveIntPipe) id: number,
    @Body(new ZodValidationPipe(updatePlayerSchema)) dto: UpdatePlayerDto,
  ): Promise<PlayerResponse> {
    return this.playersService.update(id, dto);
  }

  @Patch(':id/condition')
  async updateCondition(
    @Param('id', ParsePositiveIntPipe) id: number,
    @Body(new ZodValidationPipe(updateConditionSchema)) dto: UpdateConditionDto,
  ): Promise<PlayerResponse> {
    return this.playersService.updateCondition(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(@Param('id', ParsePositiveIntPipe) id: number): Promise<void> {
    await this.playersService.softDelete(id);
  }
}
