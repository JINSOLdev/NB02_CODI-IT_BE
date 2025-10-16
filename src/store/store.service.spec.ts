import { Test, TestingModule } from '@nestjs/testing';
import { StoreService } from './store.service';
import { StoreRepository, ProductListRow } from './store.repository';
import { UserType } from '@prisma/client';
import {
  ForbiddenException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Settings } from 'luxon';

describe('StoreService', () => {
  let service: StoreService;
  let repo: jest.Mocked<StoreRepository>;

  const mockRepo: jest.Mocked<StoreRepository> = {
    getBySellerId: jest.fn(),
    createStore: jest.fn(),
    updateStore: jest.fn(),
    findByStoreId: jest.fn(),
    findBySellerId: jest.fn(),
    findStoreIdBySellerId: jest.fn(),
    countProductByStoreId: jest.fn(),
    findProductPageByStoreId: jest.fn(),
    findStockRowsForProductsIds: jest.fn(),
    favoriteCounts: jest.fn(),
    productCounts: jest.fn(),
    monthFavoriteCounts: jest.fn(),
    totalSoldCounts: jest.fn(),
    registerFavoriteStore: jest.fn(),
    deleteFavoriteStore: jest.fn(),
  } as any;

  beforeAll(() => {
    Settings.now = () => Date.now();
  });

  afterAll(() => {
    Settings.now = () => Date.now();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreService,
        { provide: StoreRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get(StoreService);
    repo = module.get(StoreRepository) as any;
    jest.clearAllMocks();
  });

  describe('스토어 등록', () => {
    it('판매자만 생성 가능하고, 하나의 스토어만 생성 가능', async () => {
      repo.getBySellerId.mockResolvedValue(false);
      repo.createStore.mockResolvedValue({ id: 's1', sellerId: 'u1' } as any);

      const dto = {
        name: 'New Store',
        address: '서울특별시 용산구',
        phoneNumber: '02-0000-0000',
      } as any;
      const result = await service.createStore('u1', UserType.SELLER, dto);

      expect(repo.getBySellerId).toHaveBeenCalledWith('u1');
      expect(repo.createStore).toHaveBeenCalled();
      expect(result).toEqual({ id: 's1', sellerId: 'u1' });
    });

    it('이미 스토어 존재 ConflictException', async () => {
      repo.getBySellerId.mockResolvedValue(true);
      await expect(
        service.createStore('u1', UserType.SELLER, {} as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('판매자 ForbiddenException', async () => {
      await expect(
        service.createStore('u1', UserType.BUYER, {} as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('스토어 수정', () => {
    it('판매자 ForbiddenException', async () => {
      await expect(
        service.updateStore('s1', 'u1', UserType.BUYER, {} as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('스토어 없음 NotFoundException', async () => {
      repo.findByStoreId.mockResolvedValue(null);
      await expect(
        service.updateStore('s1', 'u1', UserType.SELLER, {} as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('판매자 불일치 UnauthorizedException', async () => {
      repo.findByStoreId.mockResolvedValue({
        id: 's1',
        sellerId: 'other',
      } as any);
      await expect(
        service.updateStore('s1', 'u1', UserType.SELLER, {} as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('부분 업데이트', async () => {
      repo.findByStoreId.mockResolvedValue({ id: 's1', sellerId: 'u1' } as any);
      repo.updateStore.mockResolvedValue({
        id: 's1',
        name: 'new store',
        sellerId: 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
        address: null,
        detailAddress: null,
        phoneNumber: null,
        content: null,
        image: null,
      } as any);

      await service.updateStore('s1', 'u1', UserType.SELLER, {
        name: 'new store',
      } as any);

      expect(repo.updateStore).toHaveBeenCalledWith(
        's1',
        expect.objectContaining({ name: 'new store' }),
      );
      expect(repo.updateStore).not.toHaveBeenCalledWith(
        's1',
        expect.objectContaining({ address: expect.anything() }),
      );
    });
  });

  describe('스토어 상세 조회', () => {
    it('스웨거 명세대로 반환', async () => {
      const base = {
        id: 's1',
        name: 'new store',
        createdAt: new Date(),
        updatedAt: new Date(),
        sellerId: 'u1',
        address: '서울시 용산구',
        detailAddress: '서빙고로 137',
        phoneNumber: '02-0000-0000',
        content: 'C',
        image: null,
      } as any;
      repo.findByStoreId.mockResolvedValue(base);
      repo.favoriteCounts.mockResolvedValue(3);

      const res = await service.getStoreDetail('s1');
      expect(repo.favoriteCounts).toHaveBeenCalledWith('s1');
      expect(res.favoriteCount).toBe(3);
      expect(res.id).toBe('s1');
    });

    it('존재하지 않는 스토어 NotFoundException', async () => {
      repo.findByStoreId.mockResolvedValue(null);
      await expect(service.getStoreDetail('x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('내 스토어 상세 조회', () => {
    it('판매자 ForbiddenException', async () => {
      await expect(
        service.getMyStoreDetail('u1', UserType.BUYER),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('존재하지 않는 스토어 NotFoundException', async () => {
      repo.findBySellerId.mockResolvedValue(null);
      await expect(
        service.getMyStoreDetail('u1', UserType.SELLER),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('스토어에 등록된 상품', () => {
    it('재고 합계, 품절 여부, 할인기간', async () => {
      repo.findStoreIdBySellerId.mockResolvedValue('s1');
      repo.countProductByStoreId.mockResolvedValue(2);

      const products: ProductListRow[] = [
        {
          id: 'p1',
          name: 'product1',
          image: null,
          price: 1000,
          discountPrice: null,
          discountRate: 10,
          discountStartTime: new Date('2025-10-01T00:00:00Z'),
          discountEndTime: new Date('2025-10-31T23:59:59Z'),
          createdAt: new Date('2025-10-10T00:00:00Z'),
        },
        {
          id: 'p2',
          name: 'product2',
          image: null,
          price: 2000,
          discountPrice: null,
          discountRate: null,
          discountStartTime: null,
          discountEndTime: null,
          createdAt: new Date('2025-10-09T00:00:00Z'),
        },
      ];
      repo.findProductPageByStoreId.mockResolvedValue(products);
      repo.findStockRowsForProductsIds.mockResolvedValue([
        { productId: 'p1', quantity: 2 },
        { productId: 'p1', quantity: 3 },
        { productId: 'p2', quantity: -5 },
      ]);

      const res = await service.getMyStoreProducts('u1', UserType.SELLER, {
        page: 1,
        pageSize: 10,
      } as any);
      expect(res.totalCount).toBe(2);
      expect(res.list).toHaveLength(2);

      const a = res.list.find((x) => x.id === 'p1')!;
      const b = res.list.find((x) => x.id === 'p2')!;
      expect(a.stock).toBe(5);
      expect(a.isDiscount).toBe(true);
      expect(a.isSoldOut).toBe(false);

      expect(b.stock).toBe(-5);
      expect(b.isDiscount).toBe(false);
      expect(b.isSoldOut).toBe(true);
    });

    it('제품 0개면 빈 배열로 목록 반환', async () => {
      repo.findStoreIdBySellerId.mockResolvedValue('s1');
      repo.countProductByStoreId.mockResolvedValue(0);
      repo.findProductPageByStoreId.mockResolvedValue([]);
      const res = await service.getMyStoreProducts('u1', UserType.SELLER, {
        page: 1,
        pageSize: 10,
      } as any);
      expect(res).toEqual({ list: [], totalCount: 0 });
    });

    it('판매자 아님 ForbiddenException', async () => {
      await expect(
        service.getMyStoreProducts('u1', UserType.BUYER, {
          page: 1,
          pageSize: 10,
        } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('등록된 스토어 없음 NotFoundException', async () => {
      repo.findStoreIdBySellerId.mockResolvedValue(null);
      await expect(
        service.getMyStoreProducts('u1', UserType.SELLER, {
          page: 1,
          pageSize: 10,
        } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('스토어 관심 등록', () => {
    it('자기 스토어에 관심 등록 BadRequest', async () => {
      repo.findByStoreId.mockResolvedValue({ id: 's1', sellerId: 'u1' } as any);
      await expect(service.registerInterestStore('s1', 'u1')).rejects.toThrow(
        '자신의 스토어는 관심 등록 할 수 없습니다.',
      );
    });

    it('스토어 관심 해제', async () => {
      repo.findByStoreId.mockResolvedValue({
        id: 's1',
        sellerId: 'owner',
      } as any);
      await service.deleteInterestStore('s1', 'u1');
      expect(repo.deleteFavoriteStore).toHaveBeenCalledWith('s1', 'u1');
    });
  });
});
