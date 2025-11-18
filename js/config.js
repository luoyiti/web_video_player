/**
 * 应用配置项
 */
export const CONFIG = {
  STORAGE_KEY: "mediaManagerStateV1",
  BACKEND_URL: "http://localhost:5001",
  BACKEND_TIMEOUT: 4500
};

/**
 * 初始演示数据
 * 请按需替换为你自己的视频 / 图片路径
 */
export const INITIAL_STATE = {
  currentTab: "video",
  videos: [
    {
      id: 1,
      title: "前端入门 - 播放器示例",
      src: "videos/sample1.mp4",
      tags: ["教学", "前端"]
    },
    {
      id: 2,
      title: "产品宣传片 Demo",
      src: "videos/sample2.mp4",
      tags: ["宣传", "营销"]
    },
    {
      id: 3,
      title: "会议录播片段",
      src: "videos/sample3.mp4",
      tags: ["会议", "内部"]
    }
  ],
  photos: [
    {
      id: 101,
      title: "日落城市景观",
      src: "photos/photo1.jpg",
      tags: ["风景", "城市"]
    },
    {
      id: 102,
      title: "团队合影",
      src: "photos/photo2.jpg",
      tags: ["团队", "纪念"]
    },
    {
      id: 103,
      title: "产品实拍",
      src: "photos/photo3.jpg",
      tags: ["产品", "宣传"]
    }
  ],
  currentVideoId: 1,
  currentPhotoId: 101,
  activeTag: null
};
