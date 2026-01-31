<script setup lang="ts">
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([`close`])

function onUpdate(val: boolean) {
  if (!val) {
    emit(`close`)
  }
}

const links = [
  { label: `GitHub 仓库`, url: `https://github.com/doocs/md` },
  { label: `Gitee 仓库`, url: `https://gitee.com/doocs/md` },
  { label: `GitCode 仓库`, url: `https://gitcode.com/doocs/md` },
]

function onRedirect(url: string) {
  window.open(url, `_blank`)
}
</script>

<template>
  <Dialog :open="props.visible" @update:open="onUpdate">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>关于</DialogTitle>
      </DialogHeader>
      <div class="text-center">
        <h3>一款高度简洁的微信 Markdown 编辑器</h3>
        <p>扫码关注公众号 Doocs，原创技术内容第一时间推送！</p>
        <img
          class="mx-auto my-5"
          src="https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo315dp5viv0u205o0p6rtgbk14477rn38?imageView2/2/w/540/format/webp|imageMogr2/strip2"
          alt="Doocs Markdown 编辑器"
          style="width: 40%"
        >
      </div>
      <DialogFooter class="sm:justify-evenly">
        <Button
          v-for="link in links"
          :key="link.url"
          @click="onRedirect(link.url)"
        >
          {{ link.label }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
