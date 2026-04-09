<script setup lang="ts">
const localePath = useLocalePath()

await navigateTo(localePath('/conocenos/equipo'), { redirectCode: 301 })
</script>
