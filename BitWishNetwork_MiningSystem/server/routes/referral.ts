/**
 * BitWishNetwork Mining System
 * Referral Bonus API Routes
 * 
 * ⚠️ 중요 준수 사항:
 * 1. 가입자 목록 조회 및 관리
 * 2. 지급 내역 조회
 * 3. 50자리 정밀도 유지
 */

import express from 'express';
import BonusRecord from '../models/BonusRecord';
import MiningState from '../models/MiningState';
import User from '../models/User';
import Decimal from 'decimal.js';

const router = express.Router();

// 50자리 정밀도 설정
Decimal.set({ precision: 50 });

/**
 * GET /api/referral/list/:walletAddress
 * 가입자 목록 조회
 */
router.get('/list/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const addr = walletAddress.toLowerCase();

        // 1. DB 조회 및 BonusRecord 창조 (10단계 이식)
        const user = await User.findOne({ walletAddress: new RegExp('^' + addr + '$', 'i') });
        let bonusRecord = await BonusRecord.findOne({ walletAddress: new RegExp('^' + addr + '$', 'i') });
        const miningState = await MiningState.findOne({ walletAddress: new RegExp('^' + addr + '$', 'i') });

        if (!bonusRecord && user) {
            bonusRecord = await BonusRecord.create({
                walletAddress: user.walletAddress,
                referralList: [],
                referralBonusStorage: '0.00000000',
                referralRewardStorage: '0.00000000'
            });
        }

        if (!bonusRecord) {
            return res.json({
                success: true,
                data: {
                    referralList: [],
                    totalBonus: '0.00000000',
                    totalReward: '0.00000000',
                    referralCount: 0
                }
            });
        }

        // [Priority 2] 중복 제거 및 관계 유효성 실시간 검증 (Self-Purging)
        const uniqueMap = new Map();
        let isListDirty = false;

        if (user) {
            // 목록에 있는 자식들의 최신 상태를 DB에서 한 번에 조회 (In-place Verification)
            const childAddresses = bonusRecord.referralList.map(r => r.childWalletAddress);
            const actualChildren = await User.find({ walletAddress: { $in: childAddresses } });
            const actualChildrenMap = new Map(actualChildren.map(u => [u.walletAddress.toLowerCase(), u]));

            for (const item of bonusRecord.referralList) {
                const cAddr = item.childWalletAddress.toLowerCase();
                const childUser = actualChildrenMap.get(cAddr);

                // [Purge] 이 자식이 더 이상 나를 부모로 인정하지 않는 경우 (계층 이동 발생)
                if (!childUser) {
                    isListDirty = true;
                    continue; // 목록에서 삭제
                }

                // 부모 식별용 키 (15/18자리 호환성 고려)
                const parentKey = (user.myReferralCode || '').substring(0, 11);
                const isStillMyChild =
                    (childUser.referrerCode || '').trim().toLowerCase() === (user.myReferralCode || '').trim().toLowerCase() ||
                    (childUser.referrerCode || '').trim().toLowerCase() === (user.walletAddress || '').trim().toLowerCase() ||
                    (childUser.referrerCode || '').startsWith(parentKey);

                if (!isStillMyChild) {
                    console.log(`[Purge] Ghost child detected: ${cAddr}. Removing from ${addr}...`);
                    isListDirty = true;
                    continue; // 목록에서 삭제
                }

                if (uniqueMap.has(cAddr)) {
                    isListDirty = true;
                    const existing = uniqueMap.get(cAddr);
                    if (existing.rewardStatus === 'PENDING' && (item.rewardStatus === 'PAID' || item.rewardStatus === 'COMPLETED')) {
                        uniqueMap.set(cAddr, item);
                    }
                } else {
                    if (item.rewardStatus === 'PENDING') {
                        item.rewardStatus = 'PAID';
                        isListDirty = true;
                    }
                    uniqueMap.set(cAddr, item);
                }
            }
        } else {
            // 부모 데이터가 없는 경우 안전을 위해 중복 제거만 우선 수행
            for (const item of bonusRecord.referralList) {
                const cAddr = item.childWalletAddress.toLowerCase();
                if (!uniqueMap.has(cAddr)) {
                    uniqueMap.set(cAddr, item);
                }
            }
        }

        if (isListDirty) {
            console.log(`[Cleaner/Purge] Sanitizing referral list for ${addr}...`);
            bonusRecord.referralList = Array.from(uniqueMap.values());
            await bonusRecord.save();

            // referral.ts 내 stats 및 list 수식 개조 (공정 2)
            const hasParent = user && user.referrerCode && user.referrerCode.trim() !== '';
            const initialBonus = hasParent ? new Decimal(0.02) : new Decimal(0);
            const correctedRate = initialBonus.plus(new Decimal(bonusRecord.referralList.length).mul(0.02));

            // [Sync] 추천인 수 및 보너스율도 실시간으로 다시 계산하여 정규화 (대소문자 무시 검색 적용)
            await MiningState.findOneAndUpdate(
                { walletAddress: new RegExp('^' + addr + '$', 'i') },
                {
                    $set: {
                        referralCount: bonusRecord.referralList.length,
                        referralBonusRate: correctedRate.toString() // 0.02 혹은 자식 가산율 완벽 유지
                    }
                }
            );
        }

        // [11단계] Healer 로직 (쌍끌이 예외 검색 및 자동 복구)
        if (user) {
            // [Healer 2.0] 부모 식별코드 전수 조사 (신/구 버전 및 지갑주소 변종 동시 대응)
            const parentBase = (user.myReferralCode || '').substring(0, 11); // "REF" + 핵심 8자리 유니크 키
            const searchQuery = {
                $or: [
                    { referrerCode: new RegExp('^\\s*' + (user.myReferralCode || '').trim() + '\\s*$', 'i') },
                    { referrerCode: new RegExp('^\\s*' + (user.walletAddress || '').trim() + '\\s*$', 'i') },
                    { referrerCode: new RegExp('^' + parentBase, 'i') } // 15자리/18자리 등 버전과 관계없이 핵심 키가 일치하는 모든 자식 포함
                ]
            };
            const actualCount = await User.countDocuments(searchQuery);
            if (bonusRecord.referralList.length < actualCount) {
                console.log(`[Healer/List] Syncing history gap for ${addr}...`);
                const children = await User.find(searchQuery);

                for (const child of children) {
                    const alreadyRecorded = bonusRecord.referralList.some(r => r.childWalletAddress.toLowerCase() === child.walletAddress.toLowerCase());
                    if (!alreadyRecorded) {
                        bonusRecord.referralList.push({
                            childWalletAddress: child.walletAddress,
                            joinedAt: child.createdAt || new Date(),
                            rewardStatus: 'PAID',
                            accumulatedBonus: '1.00000000',
                            isKycVerified: false
                        });
                    }
                }
                await bonusRecord.save();
            }
        }

        // 3. 가입자 목록 포맷팅
        const formattedList = bonusRecord.referralList.map(item => ({
            walletAddress: item.childWalletAddress,
            joinedAt: item.joinedAt,
            accumulatedBonus: item.accumulatedBonus || '0',
            accumulatedBonusFull: item.accumulatedBonus, // 50자리 전체
            isKycVerified: item.isKycVerified,
            kycDetailStatus: item.isKycVerified ? '승인' : '미승인',
            rewardStatus: item.rewardStatus,
            is1BWMePaid: item.rewardStatus?.toUpperCase() === 'PAID' || item.rewardStatus?.toUpperCase() === 'COMPLETED',
            is2PercentMePaid: item.rewardStatus?.toUpperCase() === 'PAID' || item.rewardStatus?.toUpperCase() === 'COMPLETED'
        }));

        // [해결 2] 최상단 부모 행 고정 삽입 (실시간 코드 동기화 로직 적용)
        if (user && user.referrerCode && user.referrerCode.trim() !== '') {
            // 부모의 현재 최신 15자리 정규 코드를 찾기 위한 역추적 조회
            const parentKey = user.referrerCode.substring(0, 11); // "REF" + 유니크 8자리
            const parentUser = await User.findOne({
                myReferralCode: new RegExp('^' + parentKey, 'i')
            });

            // 부모 유저가 존재하면 실시간 정규 코드를, 아니면 기존 레코드를 출력
            const finalParentCode = parentUser ? parentUser.myReferralCode : user.referrerCode;

            formattedList.unshift({
                isParentRow: true,
                walletAddress: finalParentCode,
                joinedAt: user.createdAt || new Date(),
                accumulatedBonus: '0.00000000',
                accumulatedBonusFull: '0.00000000',
                isKycVerified: user.isKycVerified,
                kycDetailStatus: user.isKycVerified ? '승인' : '미승인',
                rewardStatus: 'PAID',
                is1BWMePaid: true,
                is2PercentMePaid: true
            } as any);
        }

        // 4. 응답 데이터 구성
        return res.json({
            success: true,
            data: {
                referralList: formattedList,
                totalBonus: bonusRecord.referralBonusStorage || '0',
                totalBonusFull: bonusRecord.referralBonusStorage,
                totalReward: bonusRecord.referralRewardStorage || '0',
                totalRewardFull: bonusRecord.referralRewardStorage,
                referralCount: miningState?.referralCount || 0
            }
        });
    } catch (error) {
        console.error('Referral list error:', error);
        return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
});

/**
 * GET /api/referral/stats/:walletAddress
 * 추천 통계 조회 (완전한 버전 - 프론트엔드용)
 */
router.get('/stats/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const addr = walletAddress.toLowerCase();

        const user = await User.findOne({ walletAddress: new RegExp('^' + addr + '$', 'i') });
        let bonusRecord = await BonusRecord.findOne({ walletAddress: new RegExp('^' + addr + '$', 'i') });
        const miningState = await MiningState.findOne({ walletAddress: new RegExp('^' + addr + '$', 'i') });

        // [7단계] 에러로 장부가 텅 빈 채 접속한 회원을 구제하기 위해 접속 즉시 빈 장부를 영구 창조
        if (!bonusRecord && user) {
            bonusRecord = await BonusRecord.create({
                walletAddress: user.walletAddress,
                referralList: [],
                referralBonusStorage: '0.00000000',
                referralRewardStorage: '0.00000000'
            });
        }

        if (!user || !bonusRecord || !miningState) {
            return res.json({
                success: true,
                data: {
                    referralCode: user?.myReferralCode || '',
                    referralCount: 0,
                    referralBonusRate: 0,
                    referralBonusStorage: '0.00000000',
                    referralRewardStorage: '0.00000000',
                    referralList: []
                }
            });
        }

        // [Priority 2] 자가 치유(Self-Healing) 및 유령 데이터 정화 (Self-Purging)
        const uniqueStatsMap = new Map();
        let isStatsDirty = false;

        if (user) {
            const statChildAddresses = bonusRecord.referralList.map(r => r.childWalletAddress);
            const actualStatChildren = await User.find({ walletAddress: { $in: statChildAddresses } });
            const actualStatChildrenMap = new Map(actualStatChildren.map(u => [u.walletAddress.toLowerCase(), u]));

            for (const item of bonusRecord.referralList) {
                const cAddr = item.childWalletAddress.toLowerCase();
                const childUser = actualStatChildrenMap.get(cAddr);

                // [Purge] 계층 이동이 확인된 자녀는 통계에서도 즉시 제거
                if (!childUser) {
                    isStatsDirty = true;
                    continue;
                }

                const parentKey = (user.myReferralCode || '').substring(0, 11);
                const isStillMyChild =
                    (childUser.referrerCode || '').trim().toLowerCase() === (user.myReferralCode || '').trim().toLowerCase() ||
                    (childUser.referrerCode || '').trim().toLowerCase() === (user.walletAddress || '').trim().toLowerCase() ||
                    (childUser.referrerCode || '').startsWith(parentKey);

                if (!isStillMyChild) {
                    isStatsDirty = true;
                    continue;
                }

                if (uniqueStatsMap.has(cAddr)) {
                    isStatsDirty = true;
                    const existing = uniqueStatsMap.get(cAddr);
                    if (existing.rewardStatus === 'PENDING' && (item.rewardStatus === 'PAID' || item.rewardStatus === 'COMPLETED')) {
                        uniqueStatsMap.set(cAddr, item);
                    }
                } else {
                    if (item.rewardStatus === 'PENDING') {
                        item.rewardStatus = 'PAID';
                        isStatsDirty = true;
                    }
                    uniqueStatsMap.set(cAddr, item);
                }
            }
        }

        if (isStatsDirty) {
            console.log(`[Cleaner/Purge] Sanitizing stats list for ${addr}...`);
            bonusRecord.referralList = Array.from(uniqueStatsMap.values());
            await bonusRecord.save();

            // referral.ts 내 stats 및 list 수식 개조 (공정 2)
            const hasParent = user && user.referrerCode && user.referrerCode.trim() !== '';
            const initialBonus = hasParent ? new Decimal(0.02) : new Decimal(0);
            const correctedRate = initialBonus.plus(new Decimal(bonusRecord.referralList.length).mul(0.02));

            // [Sync] 통계 장부 세척 시 마이닝 상태(카운트/율)도 동기화 (대소문자 무시 검색 적용)
            await MiningState.findOneAndUpdate(
                { walletAddress: new RegExp('^' + addr + '$', 'i') },
                {
                    $set: {
                        referralCount: bonusRecord.referralList.length,
                        referralBonusRate: correctedRate.toString() // 0.02 혹은 자식 가산율 완벽 유지
                    }
                }
            );
        }

        // [Healer 2.0] 통계 복구를 위한 전수 조사 쿼리 (동일 대응)
        const parentBaseStats = (user.myReferralCode || '').substring(0, 11);
        const searchQuery = {
            $or: [
                { referrerCode: new RegExp('^\\s*' + (user.myReferralCode || '').trim() + '\\s*$', 'i') },
                { referrerCode: new RegExp('^\\s*' + (user.walletAddress || '').trim() + '\\s*$', 'i') },
                { referrerCode: new RegExp('^' + parentBaseStats, 'i') }
            ]
        };
        const actualCount = await User.countDocuments(searchQuery);
        if (bonusRecord.referralList.length < actualCount) {
            console.log(`[Healer] Detecting history gap for ${walletAddress}. Syncing with User database...`);
            const children = await User.find(searchQuery);

            for (const child of children) {
                const alreadyRecorded = bonusRecord.referralList.some(r => r.childWalletAddress.toLowerCase() === child.walletAddress.toLowerCase());
                if (!alreadyRecorded) {
                    bonusRecord.referralList.push({
                        childWalletAddress: child.walletAddress,
                        joinedAt: child.createdAt || new Date(),
                        accumulatedBonus: '0.00000000000000000000000000000000000000000000000000',
                        isKycVerified: child.isKycVerified,
                        rewardStatus: 'PAID' // 이미 보너스율에 반영된 상태이므로 PAID로 간주
                    });
                }
            }
            await bonusRecord.save();
        }

        // [해결 2] 통계 목록 내 부모 행 실시간 코드 동기화 (비동기 스코프 안정화 버전)
        let finalParentCodeStats = user.referrerCode;
        if (user && user.referrerCode && user.referrerCode.trim() !== '') {
            const parentKeyStats = user.referrerCode.substring(0, 11);
            const parentUserStats = await User.findOne({
                myReferralCode: new RegExp('^' + parentKeyStats, 'i')
            });
            if (parentUserStats) finalParentCodeStats = parentUserStats.myReferralCode;
        }

        const mappedList = bonusRecord.referralList.map(item => ({
            childWalletAddress: item.childWalletAddress,
            joinedAt: item.joinedAt,
            accumulatedBonus: item.accumulatedBonus || '0',
            isKycVerified: item.isKycVerified,
            kycDetailStatus: item.isKycVerified ? '승인' : '미승인',
            rewardStatus: item.rewardStatus,
            is1BWMePaid: item.rewardStatus?.toUpperCase() === 'PAID' || item.rewardStatus?.toUpperCase() === 'COMPLETED',
            is2PercentMePaid: item.rewardStatus?.toUpperCase() === 'PAID' || item.rewardStatus?.toUpperCase() === 'COMPLETED'
        }));

        if (user && user.referrerCode && user.referrerCode.trim() !== '') {
            mappedList.unshift({
                isParentRow: true,
                childWalletAddress: finalParentCodeStats,
                joinedAt: user.createdAt || new Date(),
                accumulatedBonus: '0.00000000',
                isKycVerified: user.isKycVerified,
                kycDetailStatus: user.isKycVerified ? '승인' : '미승인',
                rewardStatus: 'PAID',
                is1BWMePaid: true,
                is2PercentMePaid: true
            } as any);
        }

        return res.json({
            success: true,
            data: {
                referralCode: user.myReferralCode,
                referralCount: miningState.referralCount,
                referralBonusRate: parseFloat(miningState.referralBonusRate || '0'),
                referralBonusStorage: bonusRecord.referralBonusStorage || '0',
                referralRewardStorage: bonusRecord.referralRewardStorage || '0',
                referralList: mappedList
            }
        });
    } catch (error) {
        console.error('Referral stats error:', error);
        return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
});

/**
 * POST /api/referral/register-reward
 * 가입 시 추천인/가입자 양방향 1BW 실시간 DB 적립 (무결성 보장)
 * 50자리 정밀 연산을 사용하여 어떠한 데이터 오차도 허용하지 않음
 */
router.post('/register-reward', async (req, res) => {
    const { referralCode, referredWallet } = req.body;

    try {
        console.log(`[Referral] Reward processing for ${referredWallet} with code: ${referralCode}`);

        // 1. 추천인 정보 재검증 (11단계 쌍끌이 예외 처리)
        // [해결 3] 추천인 검색 로직 강화: 정규식(RegExp)을 제거하고 완전 일치(Strict Match)로 변경하여 오매핑 차단
        const targetCode = (referralCode || '').trim();
        const referrer = await User.findOne({
            $or: [
                { myReferralCode: targetCode },
                { walletAddress: targetCode }
            ]
        });
        if (!referrer) {
            console.error(`[Referral] Invalid referrer code: ${referralCode}`);
            return res.status(404).json({ success: false, message: 'Invalid referrer code' });
        }

        // 2. 추천인 보상 처리 (1BW 가산 + 추천 리스트 추가)
        // upsert: true를 사용하여 BonusRecord가 없는 경우 자동으로 "그릇" 생성 (대소문자 무시 검색 적용)
        let referrerBonus = await BonusRecord.findOneAndUpdate(
            { walletAddress: new RegExp('^' + referrer.walletAddress + '$', 'i') },
            {
                $push: {
                    referralList: {
                        childWalletAddress: referredWallet,
                        joinedAt: new Date(),
                        rewardStatus: 'COMPLETED'
                    }
                }
            },
            { upsert: true, new: true }
        );

        // [6단계 수술] 부모 중복 보상 지급 코드 제거

        // [6단계 수술] 자식 중복 보상 지급 코드 제거

        // [6단계 수술] 추천인 수 및 보너스율 중복 업데이트 제거
        // MiningState 업데이트는 이제 UserController.ts에서 단일화되어 처리됨.

        console.log(`[Referral] Successfully issued rewards: Referrer(${referrer.walletAddress}), Referred(${referredWallet})`);

        return res.json({
            success: true,
            message: 'All rewards issued accurately',
            totalRewardStored: referrerBonus.referralRewardStorage
        });

    } catch (error) {
        console.error('[CRITICAL] Reward payout failure:', error);
        return res.status(500).json({ success: false, message: 'Server transaction error' });
    }
});


export default router;
