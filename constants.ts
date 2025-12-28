
import { HistoricalEvent } from './types';

export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  {
    id: 'yongjia',
    title: '永嘉之禍',
    period: '西晉 (311年)',
    description: '西晉皇朝的終結，引發了北方民族大规模南下與衣冠南渡，是中國歷史上重大的民族融合與文化轉移起點。',
    image: 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&q=80&w=800',
    keywords: ['五胡亂華', '西晉滅亡', '衣冠南渡', '民族融合']
  },
  {
    id: 'anshi',
    title: '安史之亂',
    period: '唐朝 (755年-763年)',
    description: '唐朝由盛轉衰的關鍵轉折。安祿山與史思明的叛變，不僅摧毀了盛唐榮景，更影響了後來的藩鎮割據與社會結構變遷。',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800',
    keywords: ['唐玄宗', '楊貴妃', '由盛轉衰', '藩鎮割據']
  },
  {
    id: 'jingkang',
    title: '靖康之難',
    period: '北宋 (1127年)',
    description: '北宋的毀滅性災難。金軍攻陷汴京，徽欽二帝被虜，導致北宋滅亡與南宋偏安，是中原文化南移的又一高峰。',
    image: 'https://images.unsplash.com/photo-1545670723-196ed0954986?auto=format&fit=crop&q=80&w=800',
    keywords: ['北宋滅亡', '徽欽二帝', '岳飛抗金', '偏安江南']
  }
];

export const AUDIO_SAMPLE_RATE = 24000;
export const HOST_A_NAME = '老張'; // The expert
export const HOST_B_NAME = '小美'; // The student
