type ProjectsLoadMoreProps = {
  hasMore: boolean;
  onLoadMore: () => void;
};

const ProjectsLoadMore = ({ hasMore, onLoadMore }: ProjectsLoadMoreProps) => {
  if (!hasMore) return null;

  return (
    <div className="mt-8 flex justify-center">
      <button type="button" onClick={onLoadMore} className="btn btn-outline">
        Load more projects
      </button>
    </div>
  );
};

export default ProjectsLoadMore;