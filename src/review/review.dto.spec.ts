import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateReviewDto, UpdateReviewDto } from './review.dto';

describe('Review DTOs', () => {
  describe('CreateReviewDto', () => {
    it('유효한 데이터로 통과해야 합니다', async () => {
      const dto = plainToInstance(CreateReviewDto, {
        rating: 5,
        content: 'Great product! Highly recommended.',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    describe('rating 유효성 검사', () => {
      it('rating은 필수입니다', async () => {
        const dto = plainToInstance(CreateReviewDto, {
          content: 'Great product! Highly recommended.',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('rating');
      });

      it('rating은 정수여야 합니다', async () => {
        const dto = plainToInstance(CreateReviewDto, {
          rating: 3.5,
          content: 'Great product! Highly recommended.',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const ratingError = errors.find((e) => e.property === 'rating');
        expect(ratingError).toBeDefined();
      });

      it('rating은 최소 1이어야 합니다', async () => {
        const dto = plainToInstance(CreateReviewDto, {
          rating: 0,
          content: 'Great product! Highly recommended.',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const ratingError = errors.find((e) => e.property === 'rating');
        expect(ratingError?.constraints).toHaveProperty('min');
        expect(ratingError?.constraints?.min).toContain('최소 1점');
      });

      it('rating은 최대 5여야 합니다', async () => {
        const dto = plainToInstance(CreateReviewDto, {
          rating: 6,
          content: 'Great product! Highly recommended.',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const ratingError = errors.find((e) => e.property === 'rating');
        expect(ratingError?.constraints).toHaveProperty('max');
        expect(ratingError?.constraints?.max).toContain('최대 5점');
      });

      it('rating 1은 허용되어야 합니다', async () => {
        const dto = plainToInstance(CreateReviewDto, {
          rating: 1,
          content: 'Not satisfied with this product.',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('rating 5는 허용되어야 합니다', async () => {
        const dto = plainToInstance(CreateReviewDto, {
          rating: 5,
          content: 'Excellent product! Perfect!',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('rating 3 (중간값)은 허용되어야 합니다', async () => {
        const dto = plainToInstance(CreateReviewDto, {
          rating: 3,
          content: 'Average product, meets expectations.',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });

    describe('content 유효성 검사', () => {
      it('content는 필수입니다', async () => {
        const dto = plainToInstance(CreateReviewDto, {
          rating: 5,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const contentError = errors.find((e) => e.property === 'content');
        expect(contentError).toBeDefined();
      });

      it('content는 문자열이어야 합니다', async () => {
        const dto = plainToInstance(CreateReviewDto, {
          rating: 5,
          content: 12345,
        } as any);

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const contentError = errors.find((e) => e.property === 'content');
        expect(contentError).toBeDefined();
      });

      it('content는 비어있을 수 없습니다', async () => {
        const dto = plainToInstance(CreateReviewDto, {
          rating: 5,
          content: '',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const contentError = errors.find((e) => e.property === 'content');
        expect(contentError?.constraints).toHaveProperty('isNotEmpty');
      });

      it('content는 최소 10자 이상이어야 합니다', async () => {
        const dto = plainToInstance(CreateReviewDto, {
          rating: 5,
          content: 'Too short',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const contentError = errors.find((e) => e.property === 'content');
        expect(contentError?.constraints).toHaveProperty('minLength');
        expect(contentError?.constraints?.minLength).toContain('최소 10자');
      });

      it('content 정확히 10자는 허용되어야 합니다', async () => {
        const dto = plainToInstance(CreateReviewDto, {
          rating: 5,
          content: '1234567890',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('content 10자 이상은 모두 허용되어야 합니다', async () => {
        const dto = plainToInstance(CreateReviewDto, {
          rating: 5,
          content: 'This is a very long review content that exceeds the minimum requirement.',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('공백만 있는 content는 허용되지 않아야 합니다', async () => {
        const dto = plainToInstance(CreateReviewDto, {
          rating: 5,
          content: '          ',
        });

        const errors = await validate(dto);
        // isNotEmpty should catch this if content is trimmed
        const contentError = errors.find((e) => e.property === 'content');
        // Note: class-validator's isNotEmpty checks for empty strings after trim by default
        expect(contentError).toBeDefined();
      });
    });

    it('여러 유효성 검사 오류를 한 번에 반환해야 합니다', async () => {
      const dto = plainToInstance(CreateReviewDto, {
        rating: 10,
        content: 'Short',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      // Should have errors for both rating and content
      const ratingError = errors.find((e) => e.property === 'rating');
      const contentError = errors.find((e) => e.property === 'content');
      expect(ratingError).toBeDefined();
      expect(contentError).toBeDefined();
    });
  });

  describe('UpdateReviewDto', () => {
    it('유효한 데이터로 통과해야 합니다', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        rating: 4,
        content: 'Updated review content here.',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('모든 필드가 선택적이어야 합니다', async () => {
      const dto = plainToInstance(UpdateReviewDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    describe('rating 유효성 검사 (선택적)', () => {
      it('rating이 제공되면 정수여야 합니다', async () => {
        const dto = plainToInstance(UpdateReviewDto, {
          rating: 3.7,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const ratingError = errors.find((e) => e.property === 'rating');
        expect(ratingError).toBeDefined();
      });

      it('rating이 제공되면 최소 1이어야 합니다', async () => {
        const dto = plainToInstance(UpdateReviewDto, {
          rating: 0,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const ratingError = errors.find((e) => e.property === 'rating');
        expect(ratingError?.constraints).toHaveProperty('min');
        expect(ratingError?.constraints?.min).toContain('최소 1점');
      });

      it('rating이 제공되면 최대 5여야 합니다', async () => {
        const dto = plainToInstance(UpdateReviewDto, {
          rating: 7,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const ratingError = errors.find((e) => e.property === 'rating');
        expect(ratingError?.constraints).toHaveProperty('max');
        expect(ratingError?.constraints?.max).toContain('최대 5점');
      });

      it('rating만 업데이트할 수 있어야 합니다', async () => {
        const dto = plainToInstance(UpdateReviewDto, {
          rating: 3,
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });

    describe('content 유효성 검사 (선택적)', () => {
      it('content가 제공되면 문자열이어야 합니다', async () => {
        const dto = plainToInstance(UpdateReviewDto, {
          content: 123,
        } as any);

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const contentError = errors.find((e) => e.property === 'content');
        expect(contentError).toBeDefined();
      });

      it('content가 제공되면 비어있을 수 없습니다', async () => {
        const dto = plainToInstance(UpdateReviewDto, {
          content: '',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const contentError = errors.find((e) => e.property === 'content');
        expect(contentError?.constraints).toHaveProperty('isNotEmpty');
      });

      it('content가 제공되면 최소 10자 이상이어야 합니다', async () => {
        const dto = plainToInstance(UpdateReviewDto, {
          content: 'Short one',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const contentError = errors.find((e) => e.property === 'content');
        expect(contentError?.constraints).toHaveProperty('minLength');
        expect(contentError?.constraints?.minLength).toContain('최소 10자');
      });

      it('content만 업데이트할 수 있어야 합니다', async () => {
        const dto = plainToInstance(UpdateReviewDto, {
          content: 'Updated content only here.',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });

    it('rating과 content를 동시에 업데이트할 수 있어야 합니다', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        rating: 5,
        content: 'Both fields updated successfully!',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('잘못된 rating과 content를 함께 제공하면 두 오류를 반환해야 합니다', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        rating: 10,
        content: 'Bad',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const ratingError = errors.find((e) => e.property === 'rating');
      const contentError = errors.find((e) => e.property === 'content');
      expect(ratingError).toBeDefined();
      expect(contentError).toBeDefined();
    });

    it('undefined 값은 허용되어야 합니다', async () => {
      const dto = plainToInstance(UpdateReviewDto, {
        rating: undefined,
        content: undefined,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});