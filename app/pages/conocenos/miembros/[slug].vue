<script setup lang="ts">
const localePath = useLocalePath()

await navigateTo(localePath('/conocenos/miembros'), { redirectCode: 301 })
</script>
