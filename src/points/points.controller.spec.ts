import { Test, TestingModule } from '@nestjs/testing';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';
import { GradeLevel } from '@prisma/client';

describe('PointsController', () => {
  let controller: PointsController;

  const getMyPointSummaryMock = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointsController],
      providers: [
        {
          provide: PointsService,
          useValue: {
            getMyPointSummary: getMyPointSummaryMock,
          } satisfies Partial<PointsService>,
        },
      ],
    }).compile();

    controller = module.get(PointsController);
    getMyPointSummaryMock.mockReset();
  });

  it('GET /api/users/me/points: service.getMyPointSummary를 호출하고 결과를 반환한다', async () => {
    const userId = 'user_123';
    const req: { user: { userId: string } } = { user: { userId } };

    const summary: Awaited<ReturnType<PointsService['getMyPointSummary']>> = {
      points: 1000,
      gradeLevel: GradeLevel.GREEN,
      lifetimePurchase: 50000,
      earnRate: 0.01,
      nextGrade: GradeLevel.ORANGE,
      needToNext: 50000,
    };

    getMyPointSummaryMock.mockResolvedValue(summary);

    const result = await controller.getMyPoints(req);

    expect(getMyPointSummaryMock).toHaveBeenCalledWith(userId);
    expect(result).toEqual(summary);
  });
});
