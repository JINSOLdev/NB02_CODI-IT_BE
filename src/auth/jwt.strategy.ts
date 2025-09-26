import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { GRADE_MAP, GradeLevel } from '../grades/grade.constants';
import { AuthUser, JwtPayloadCompat } from './auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      secretOrKey: process.env.JWT_SECRET ?? 'dev_secret',
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayloadCompat): Promise<AuthUser> {
    const subject = payload.sub ?? payload.userId ?? payload.id;
    if (!subject)
      throw new UnauthorizedException('Invalid token: missing subject (sub)');

    const user = await this.usersService.findById(subject);
    if (!user)
      throw new UnauthorizedException('User not found or invalid token');

    const gradeKey = user.gradeLevel as GradeLevel;
    return {
      userId: user.id,
      email: user.email,
      type: user.type,
      points: user.points,
      grade: GRADE_MAP[gradeKey],
    };
  }
}
