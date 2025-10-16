import { Test, TestingModule } from '@nestjs/testing';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import type { AuthUser } from '../auth/auth.types';
import { UserType } from '@prisma/client';

describe('StoreController', () => {
  let controller: StoreController;
  let service: jest.Mocked<StoreService>;

  const mockService: jest.Mocked<StoreService> = {
    createStore: jest.fn(),
    updateStore: jest.fn(),
    getStoreDetail: jest.fn(),
    getMyStoreDetail: jest.fn(),
    getMyStoreProducts: jest.fn(),
    registerInterestStore: jest.fn(),
    deleteInterestStore: jest.fn(),
  } as any;

  const req = (over?: Partial<AuthUser>) => ({
    user: { userId: 'u1', type: UserType.SELLER, ...(over ?? {}) } as AuthUser,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoreController],
      providers: [{ provide: StoreService, useValue: mockService }],
    }).compile();

    controller = module.get(StoreController);
    service = module.get(StoreService) as any;
    jest.clearAllMocks();
  });

  it('스토어 등록', async () => {
    service.createStore.mockResolvedValue({ id: 's1' } as any);
    const dto = {
      name: 'New Store',
      address: '서울특별시 용산구',
      detailAddress: '서빙고로 137',
      phoneNumber: '02-0000-0000',
      content: '트렌디한 백자를 판매합니다.',
    } as any;
    const result = await controller.create(req(), dto);
    expect(service.createStore).toHaveBeenCalledWith(
      'u1',
      UserType.SELLER,
      dto,
    );
    expect(result).toEqual({ id: 's1' });
  });

  it('내 스토어 상세 조회', async () => {
    service.getMyStoreDetail.mockResolvedValue({ id: 's1' } as any);
    await controller.getMyStoreDetail(req());
    expect(service.getMyStoreDetail).toHaveBeenCalledWith(
      'u1',
      UserType.SELLER,
    );
  });

  it('스토어에 등록된 상품 목록 조회', async () => {
    service.getMyStoreProducts.mockResolvedValue({ list: [], totalCount: 0 });
    const query = { page: 2, pageSize: 5 } as any;
    await controller.getMyStoreProducts(req(), query);
    expect(service.getMyStoreProducts).toHaveBeenCalledWith(
      'u1',
      UserType.SELLER,
      query,
    );
  });

  it('스토어 상세 조회', async () => {
    service.getStoreDetail.mockResolvedValue({ id: 's1' } as any);
    await controller.getStoreDetail('s1');
    expect(service.getStoreDetail).toHaveBeenCalledWith('s1');
  });

  it('스토어 수정', async () => {
    service.updateStore.mockResolvedValue({ id: 's1' } as any);
    const dto = { name: 'new' } as any;
    await controller.updateStore(
      's1',
      { user: { userId: 'u1', type: UserType.SELLER } } as any,
      dto,
    );
    expect(service.updateStore).toHaveBeenCalledWith(
      's1',
      'u1',
      UserType.SELLER,
      dto,
    );
  });

  it('관심 스토어 등록', async () => {
    service.registerInterestStore.mockResolvedValue({
      store: { id: 's1' } as any,
    });
    await controller.registerInterestStore('s1', req());
    expect(service.registerInterestStore).toHaveBeenCalledWith('s1', 'u1');
  });

  it('관심 스토어 해제', async () => {
    service.deleteInterestStore.mockResolvedValue({
      store: { id: 's1' } as any,
    });
    await controller.deleteInterestStore('s1', req());
    expect(service.deleteInterestStore).toHaveBeenCalledWith('s1', 'u1');
  });
});
