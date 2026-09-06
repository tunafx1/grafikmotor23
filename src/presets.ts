import { DesignTemplate } from './types';

export const TEMPLATE_PRESETS: DesignTemplate[] = [
  {
    id: 'preset-modern-minimalist',
    name: 'Minimalist & Modern Lansman',
    width: 1080,
    height: 1080,
    backgroundColor: '#111113',
    palette: {
      primary: '#FF6B1A',
      accent: '#FFA26B',
      text: 'rgba(255,255,255,0.95)',
      bg: '#111113',
      boldHighlight: '#FFA26B'
    },
    regions: [
      {
        id: 'region-badge',
        name: 'Kategori / Etiket',
        type: 'text',
        x: 90,
        y: 80,
        width: 320,
        height: 50,
        backgroundColor: 'rgba(255, 107, 26, 0.15)',
        opacity: 1,
        borderColor: '#FF6B1A',
        borderWidth: 1,
        borderRadius: 25,
        isDynamic: true,
        placeholderText: 'YENİ NESİL TASARIM',
        textRole: 'subtitle',
        textStyle: {
          fontFamily: 'Inter',
          fontSize: 16,
          color: '#FF6B1A',
          fontWeight: 'bold',
          lineHeight: 1.2,
          align: 'center',
          letterSpacing: 2
        }
      },
      {
        id: 'region-title-main',
        name: 'Ana Başlık Alanı',
        type: 'text',
        x: 90,
        y: 160,
        width: 900,
        height: 220,
        backgroundColor: 'transparent',
        opacity: 1,
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0,
        isDynamic: true,
        placeholderText: 'Geleceği **Şekillendiren** Tasarım Standartları',
        textRole: 'title',
        textStyle: {
          fontFamily: 'Space Grotesk',
          fontSize: 56,
          color: '#FFFFFF',
          fontWeight: 'bold',
          lineHeight: 1.15,
          align: 'left'
        }
      },
      {
        id: 'region-desc-main',
        name: 'Açıklama Metni',
        type: 'text',
        x: 90,
        y: 400,
        width: 900,
        height: 120,
        backgroundColor: 'transparent',
        opacity: 1,
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0,
        isDynamic: true,
        placeholderText: 'Yapay zeka odaklı otomatik grafik motoru ile sosyal medya paylaşımlarınızı *saniyeler içinde* profesyonelleştirin.',
        textRole: 'description',
        textStyle: {
          fontFamily: 'Inter',
          fontSize: 24,
          color: 'rgba(255,255,255,0.75)',
          fontWeight: 'normal',
          lineHeight: 1.5,
          align: 'left'
        }
      },
      {
        id: 'region-image-main',
        name: 'Ana Görsel Alanı',
        type: 'image',
        x: 90,
        y: 540,
        width: 900,
        height: 450,
        backgroundColor: '#1E1E22',
        opacity: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderRadius: 20,
        isDynamic: true,
        placeholderImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80',
        clipImage: true
      }
    ],
    fixedElements: []
  },
  {
    id: 'preset-tech-gradient',
    name: 'Teknoloji & Yapay Zeka',
    width: 1080,
    height: 1080,
    backgroundColor: '#0A0C14',
    backgroundGradient: {
      type: 'linear',
      colors: ['#0A0C14', '#151928'],
      angle: 135
    },
    palette: {
      primary: '#00F2FE',
      accent: '#4FACFE',
      text: '#FFFFFF',
      bg: '#0A0C14',
      boldHighlight: '#00F2FE'
    },
    regions: [
      {
        id: 'region-tech-title',
        name: 'Teknoloji Başlığı',
        type: 'text',
        x: 80,
        y: 120,
        width: 920,
        height: 200,
        backgroundColor: 'transparent',
        opacity: 1,
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0,
        isDynamic: true,
        placeholderText: '**Yapay Zeka** ile Yeni Ufuklar Keşfedin',
        textRole: 'title',
        textStyle: {
          fontFamily: 'Space Grotesk',
          fontSize: 52,
          color: '#FFFFFF',
          fontWeight: 'bold',
          lineHeight: 1.2,
          align: 'left'
        }
      },
      {
        id: 'region-tech-desc',
        name: 'Teknoloji Açıklaması',
        type: 'text',
        x: 80,
        y: 340,
        width: 920,
        height: 130,
        backgroundColor: 'transparent',
        opacity: 1,
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0,
        isDynamic: true,
        placeholderText: 'Gelişmiş algoritmalar ve *büyük dil modelleri* ile iş süreçlerinizi otomatikleştirin, veriminizi 10 katına çıkarın.',
        textRole: 'description',
        textStyle: {
          fontFamily: 'Inter',
          fontSize: 22,
          color: 'rgba(255,255,255,0.7)',
          fontWeight: 'normal',
          lineHeight: 1.4,
          align: 'left'
        }
      },
      {
        id: 'region-tech-image',
        name: 'Görsel Vitrini',
        type: 'image',
        x: 80,
        y: 490,
        width: 920,
        height: 500,
        backgroundColor: '#121726',
        opacity: 1,
        borderColor: 'rgba(0, 242, 254, 0.3)',
        borderWidth: 1,
        borderRadius: 24,
        isDynamic: true,
        placeholderImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1080&q=80',
        clipImage: true
      }
    ],
    fixedElements: []
  },
  {
    id: 'preset-editorial-fashion',
    name: 'Moda & Zamansız Koleksiyon',
    width: 1080,
    height: 1080,
    backgroundColor: '#F7F5F0',
    palette: {
      primary: '#2B2B2B',
      accent: '#C97A5E',
      text: '#1C1C1E',
      bg: '#F7F5F0',
      boldHighlight: '#C97A5E'
    },
    regions: [
      {
        id: 'region-editorial-image',
        name: 'Moda Görseli',
        type: 'image',
        x: 80,
        y: 80,
        width: 920,
        height: 600,
        backgroundColor: '#EBE7DE',
        opacity: 1,
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 12,
        isDynamic: true,
        placeholderImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1080&q=80',
        clipImage: true
      },
      {
        id: 'region-editorial-title',
        name: 'Koleksiyon Başlığı',
        type: 'text',
        x: 80,
        y: 710,
        width: 920,
        height: 130,
        backgroundColor: 'transparent',
        opacity: 1,
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0,
        isDynamic: true,
        placeholderText: 'Yeni Sezon: **Zamansız** Dokunuşlar',
        textRole: 'title',
        textStyle: {
          fontFamily: 'Playfair Display',
          fontSize: 48,
          color: '#1C1C1E',
          fontWeight: 'bold',
          lineHeight: 1.2,
          align: 'center'
        }
      },
      {
        id: 'region-editorial-desc',
        name: 'Koleksiyon Açıklaması',
        type: 'text',
        x: 140,
        y: 860,
        width: 800,
        height: 120,
        backgroundColor: 'transparent',
        opacity: 1,
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0,
        isDynamic: true,
        placeholderText: 'Doğal pamuk iplikleri ve *sürdürülebilir işçilikle* harmanlanan en özel parçalar mağazada.',
        textRole: 'description',
        textStyle: {
          fontFamily: 'Inter',
          fontSize: 20,
          color: '#666666',
          fontWeight: 'normal',
          lineHeight: 1.4,
          align: 'center'
        }
      }
    ],
    fixedElements: []
  }
];
