import React, { useState, useEffect, useCallback } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  TextField,
  Box,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CardActions,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Cropper from 'react-easy-crop';

// 360도 전체 스펙트럼에서 회색빛이 섞인 눈이 편안한 뮤트 파스텔/스톤 컬러 랜덤 생성
function generateRandomMutedColor(prevHue?: number): { color: string; hue: number } {
  let hue = Math.floor(Math.random() * 360);
  if (prevHue !== undefined && Math.abs(hue - prevHue) < 55) {
    hue = (hue + 110) % 360;
  }
  const saturation = Math.floor(Math.random() * 8) + 15; // 채도 15~22% (뮤트 톤)
  const lightness = Math.floor(Math.random() * 5) + 87;  // 명도 87~91%
  return {
    color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    hue,
  };
}

const modernTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2C2B29',
    },
    secondary: {
      main: '#8C8881',
    },
    background: {
      default: '#F4F2ED',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2C2B29',
      secondary: '#6E6A63',
    },
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans JP", -apple-system, BlinkMacSystemFont, sans-serif',
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 16,
  },
});

interface Item {
  id: number;
  title: string;
  category: string;
  imageUrl: string;
  memo: string;
}

// public 폴더에 넣은 기본 파트너 이미지 3장 연결
const initialItems: Item[] = [
  {
    id: 1,
    title: 'コジョンド',
    category: 'パートナー',
    imageUrl: './partner1.jpg',
    memo: '格闘エース',
  },
  {
    id: 2,
    title: 'ジャローダ',
    category: 'パートナー',
    imageUrl: './partner2.jpg',
    memo: '相棒',
  },
  {
    id: 3,
    title: 'シャワーズ',
    category: 'パートナー',
    imageUrl: './partner3.jpg',
    memo: '防御が硬い',
  },
];

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<string> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return imageSrc;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg');
}

export default function App() {
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem('my_goods_collection_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialItems;
  });

  useEffect(() => {
    localStorage.setItem('my_goods_collection_v2', JSON.stringify(items));
  }, [items]);

  // 1.8초마다 전체 뮤트 스펙트럼에서 랜덤 색상으로 빠르게 전환
  const [bgState, setBgState] = useState(() => generateRandomMutedColor());

  useEffect(() => {
    const timer = setInterval(() => {
      setBgState((prev) => generateRandomMutedColor(prev.hue));
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [memo, setMemo] = useState('');

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleOpenAdd = () => {
    setEditId(null);
    setTitle('');
    setCategory('');
    setImageUrl('');
    setMemo('');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setOpen(true);
  };

  const handleOpenEdit = (item: Item) => {
    setEditId(item.id);
    setTitle(item.title);
    setCategory(item.category);
    setImageUrl(item.imageUrl);
    setMemo(item.memo);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveItem = async () => {
    if (!title) return;

    let finalImageUrl = imageUrl || 'https://via.placeholder.com/300x200/3D3B38/F9F8F4?text=No+Image';

    if (imageUrl && croppedAreaPixels) {
      try {
        finalImageUrl = await getCroppedImg(imageUrl, croppedAreaPixels);
      } catch (e) {
        console.error('Cropping failed', e);
      }
    }

    if (editId !== null) {
      setItems(
        items.map((item) =>
          item.id === editId
            ? { ...item, title, category: category || 'パートナー', imageUrl: finalImageUrl, memo }
            : item
        )
      );
    } else {
      const newItem: Item = {
        id: Date.now(),
        title,
        category: category || 'パートナー',
        imageUrl: finalImageUrl,
        memo,
      };
      setItems([...items, newItem]);
    }

    setOpen(false);
  };

  const handleDeleteItem = (id: number) => {
    if (window.confirm('このパートナーを削除しますか？')) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.memo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ThemeProvider theme={modernTheme}>
      <CssBaseline />

      {/* 배경색이 1.1초에 걸쳐 경쾌하고 부드럽게 페이드 전환 */}
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: bgState.color,
          transition: 'background-color 1.1s ease-in-out',
        }}
      >
        {/* 반투명 블러 상단 헤더 */}
        <AppBar
          position="sticky"
          color="transparent"
          elevation={0}
          sx={{
            borderBottom: '1px solid rgba(44, 43, 41, 0.08)',
            bgcolor: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', py: 1, maxWidth: 'lg', width: '100%', mx: 'auto' }}>
            <Box>
              <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                My Partner Gallery
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                自慢の相棒コレクション
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenAdd}
              sx={{
                borderRadius: 10,
                px: 2.5,
                py: 0.9,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none', bgcolor: '#43413E' },
              }}
            >
              パートナーを追加
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 5 }}>
          {/* 검색창 */}
          <Box sx={{ mb: 4.5 }}>
            <TextField
              fullWidth
              placeholder="ポケモン名・役割・メモで検索..."
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.85)',
                  borderRadius: 4,
                  '& fieldset': { borderColor: 'rgba(44, 43, 41, 0.12)' },
                  '&:hover fieldset': { borderColor: 'rgba(44, 43, 41, 0.28)' },
                },
              }}
            />
          </Box>

          {/* 인스타 피드 스타일 3열 그리드 */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: '28px',
              width: '100%',
            }}
          >
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 4,
                  overflow: 'hidden',
                  bgcolor: '#FFFFFF',
                  boxShadow: '0 8px 24px rgba(44, 43, 41, 0.04)',
                  border: '1px solid rgba(44, 43, 41, 0.07)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 14px 32px rgba(44, 43, 41, 0.08)',
                  },
                }}
              >
                {/* 이미지 영역: 300 x 200 (3:2 고정) */}
                <Box
                  sx={{
                    width: '100%',
                    height: 200,
                    bgcolor: '#EFECE6',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    component="img"
                    src={item.imageUrl}
                    alt={item.title}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>

                <CardContent sx={{ flexGrow: 1, p: 3, pb: 1.5, textAlign: 'center' }}>
                  <Chip
                    label={item.category}
                    size="small"
                    sx={{
                      bgcolor: '#F4F1EA',
                      color: '#6E6A63',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      mb: 1.2,
                      borderRadius: 2,
                    }}
                  />
                  <Typography variant="h6" sx={{ color: 'text.primary', fontSize: '1.1rem', mb: 0.5 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.memo}
                  </Typography>
                </CardContent>

                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2, pt: 0 }}>
                  <IconButton size="small" onClick={() => handleOpenEdit(item)} sx={{ color: '#8C8881' }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteItem(item.id)} sx={{ color: '#B87A76' }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            ))}
          </Box>
        </Container>

        {/* 등록 / 수정 모달 */}
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          fullWidth
          maxWidth="xs"
          PaperProps={{
            sx: {
              borderRadius: 5,
              p: 1,
              bgcolor: '#FDFCFA',
              boxShadow: '0 20px 48px rgba(44, 43, 41, 0.14)',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, pt: 2.5, px: 3, color: 'text.primary' }}>
            {editId !== null ? 'パートナーの編集' : '新しいパートナー登録'}
          </DialogTitle>
          <DialogContent sx={{ px: 3, py: 1 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="ポケモン名 / ニックネーム (必須)"
                variant="outlined"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <TextField
                label="役割・タグ (例: パートナー / 色違い)"
                variant="outlined"
                fullWidth
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <TextField
                label="画像URL (任意)"
                variant="outlined"
                fullWidth
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />

              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{
                  borderColor: 'rgba(44, 43, 41, 0.2)',
                  color: 'text.primary',
                  py: 1.2,
                  borderRadius: 3,
                  textTransform: 'none',
                }}
              >
                ベストショットをアップロード
                <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
              </Button>

              {imageUrl && (
                <Box sx={{ border: '1px solid #E6E2DA', borderRadius: 3, p: 1.5, bgcolor: '#F9F8F4' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block', color: 'text.secondary' }}>
                    サムネイル調整 (ドラッグ移動 / ホイール拡大)
                  </Typography>
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: 200,
                      borderRadius: 2,
                      overflow: 'hidden',
                      bgcolor: '#2C2B29',
                    }}
                  >
                    <Cropper
                      image={imageUrl}
                      crop={crop}
                      zoom={zoom}
                      aspect={3 / 2}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  </Box>
                </Box>
              )}

              <TextField
                label="アピールポイント・メモ"
                variant="outlined"
                multiline
                rows={2}
                fullWidth
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
            <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>
              キャンセル
            </Button>
            <Button
              onClick={handleSaveItem}
              variant="contained"
              color="primary"
              sx={{ px: 3, py: 1, borderRadius: 10, fontWeight: 600, boxShadow: 'none' }}
            >
              {editId !== null ? '更新する' : '登録する'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}
